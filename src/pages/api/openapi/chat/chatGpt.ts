import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase, Model } from '@/service/mongo';
import { getOpenAIApi } from '@/service/utils/chat';
import { httpsAgent, openaiChatFilter, authOpenApiKey } from '@/service/utils/tools';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai';
import { ChatItemType } from '@/types/chat';
import { jsonRes } from '@/service/response';
import { PassThrough } from 'stream';
import { modelList } from '@/constants/model';
import { pushChatBill } from '@/service/events/pushBill';
import { gpt35StreamResponse } from '@/service/utils/openai';

/* 发送提示词 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let step = 0; // step=1时，表示开始了流响应
  const stream = new PassThrough();
  stream.on('error', () => {
    console.log('error: ', 'stream error');
    stream.destroy();
  });
  res.on('close', () => {
    stream.destroy();
  });
  res.on('error', () => {
    console.log('error: ', 'request error');
    stream.destroy();
  });

  try {
    const {
      prompts,
      modelId,
      isStream = true
    } = req.body as {
      prompts: ChatItemType[];
      modelId: string;
      isStream: boolean;
    };

    if (!prompts || !modelId) {
      throw new Error('缺少参数');
    }
    if (!Array.isArray(prompts)) {
      throw new Error('prompts is not array');
    }
    if (prompts.length > 30 || prompts.length === 0) {
      throw new Error('prompts length range 1-30');
    }

    await connectToDatabase();
    let startTime = Date.now();

    const { apiKey, userId } = await authOpenApiKey(req);

    const model = await Model.findOne({
      _id: modelId,
      userId
    });

    if (!model) {
      throw new Error('无权使用该模型');
    }

    const modelConstantsData = modelList.find((item) => item.model === model.service.modelName);
    if (!modelConstantsData) {
      throw new Error('模型加载异常');
    }

    // 如果有系统提示词，自动插入
    if (model.systemPrompt) {
      prompts.unshift({
        obj: 'SYSTEM',
        value: model.systemPrompt
      });
    }

    // 格式化文本内容成 chatgpt 格式
    const map = {
      Human: ChatCompletionRequestMessageRoleEnum.User,
      AI: ChatCompletionRequestMessageRoleEnum.Assistant,
      SYSTEM: ChatCompletionRequestMessageRoleEnum.System
    };
    const formatPrompts: ChatCompletionRequestMessage[] = prompts.map((item: ChatItemType) => ({
      role: map[item.obj],
      content: item.value
    }));
    // console.log(formatPrompts);
    // 计算温度
    const temperature = modelConstantsData.maxTemperature * (model.temperature / 10);

    // 获取 chatAPI
    const chatAPI = getOpenAIApi(apiKey);
    // 发出请求
    const chatResponse = await chatAPI.createChatCompletion(
      {
        model: model.service.chatModel,
        temperature: temperature,
        // max_tokens: modelConstantsData.maxToken,
        messages: formatPrompts,
        frequency_penalty: 0.5, // 越大，重复内容越少
        presence_penalty: -0.5, // 越大，越容易出现新内容
        stream: isStream,
        stop: ['.!?。']
      },
      {
        timeout: 40000,
        responseType: isStream ? 'stream' : 'json',
        httpsAgent: httpsAgent(true)
      }
    );

    console.log('api response time:', `${(Date.now() - startTime) / 1000}s`);

    step = 1;
    let responseContent = '';

    if (isStream) {
      const streamResponse = await gpt35StreamResponse({
        res,
        stream,
        chatResponse
      });
      responseContent = streamResponse.responseContent;
    } else {
      responseContent = chatResponse.data.choices?.[0]?.message?.content || '';
      jsonRes(res, {
        data: responseContent
      });
    }

    const promptsContent = formatPrompts.map((item) => item.content).join('');

    // 只有使用平台的 key 才计费
    pushChatBill({
      isPay: true,
      modelName: model.service.modelName,
      userId,
      text: promptsContent + responseContent
    });
  } catch (err: any) {
    if (step === 1) {
      // 直接结束流
      console.log('error，结束');
      stream.destroy();
    } else {
      res.status(500);
      jsonRes(res, {
        code: 500,
        error: err
      });
    }
  }
}
