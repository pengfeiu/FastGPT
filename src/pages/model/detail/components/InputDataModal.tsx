import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  Textarea
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { postModelDataInput, putModelDataById } from '@/api/model';
import { useToast } from '@/hooks/useToast';
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 12);

export type FormData = { dataId?: string; a: string; q: string };

const InputDataModal = ({
  onClose,
  onSuccess,
  modelId,
  defaultValues = {
    a: '',
    q: ''
  }
}: {
  onClose: () => void;
  onSuccess: () => void;
  modelId: string;
  defaultValues?: FormData;
}) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues
  });

  /**
   * 确认导入新数据
   */
  const sureImportData = useCallback(
    async (e: FormData) => {
      setImporting(true);

      try {
        const res = await postModelDataInput({
          modelId: modelId,
          data: [
            {
              a: e.a,
              q: e.q
            }
          ]
        });

        toast({
          title: res === 0 ? '导入数据成功,需要一段时间训练' : '数据导入异常',
          status: res === 0 ? 'success' : 'warning'
        });
        reset({
          a: '',
          q: ''
        });
        onSuccess();
      } catch (err) {
        console.log(err);
      }
      setImporting(false);
    },
    [modelId, onSuccess, reset, toast]
  );

  const updateData = useCallback(
    async (e: FormData) => {
      if (!e.dataId) return;

      if (e.a !== defaultValues.a || e.q !== defaultValues.q) {
        await putModelDataById({
          dataId: e.dataId,
          a: e.a,
          q: e.q === defaultValues.q ? '' : e.q
        });
        onSuccess();
      }

      toast({
        title: '修改回答成功',
        status: 'success'
      });
      onClose();
    },
    [defaultValues, onClose, onSuccess, toast]
  );

  return (
    <Modal isOpen={true} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        m={0}
        display={'flex'}
        flexDirection={'column'}
        h={'90vh'}
        maxW={'90vw'}
        position={'relative'}
      >
        <ModalHeader>手动导入</ModalHeader>
        <ModalCloseButton />

        <Box
          display={['block', 'flex']}
          flex={'1 0 0'}
          h={['100%', 0]}
          overflowY={'auto'}
          px={6}
          pb={2}
        >
          <Box flex={2} mr={[0, 4]} mb={[4, 0]} h={['230px', '100%']}>
            <Box h={'30px'}>问题</Box>
            <Textarea
              placeholder={
                '相关问题，可以输入多个问法, 最多500字。例如：\n1. laf 是什么？\n2. laf 可以做什么？\n3. laf怎么用'
              }
              maxLength={500}
              resize={'none'}
              h={'calc(100% - 30px)'}
              {...register(`q`, {
                required: '相关问题，可以回车输入多个问法'
              })}
            />
          </Box>
          <Box flex={3} h={['330px', '100%']}>
            <Box h={'30px'}>知识点</Box>
            <Textarea
              placeholder={
                '知识点，最多1000字。请保持主语的完整性，缺少主语会导致效果不佳。例如：\n1. laf是一个云函数开发平台。\n2. laf 什么都能做。\n3. 下面是使用 laf 的例子: ……'
              }
              maxLength={1000}
              resize={'none'}
              h={'calc(100% - 30px)'}
              {...register(`a`, {
                required: '知识点'
              })}
            />
          </Box>
        </Box>

        <Flex px={6} pt={2} pb={4}>
          <Box flex={1}></Box>
          <Button variant={'outline'} mr={3} onClick={onClose}>
            取消
          </Button>
          <Button
            isLoading={importing}
            onClick={handleSubmit(defaultValues.dataId ? updateData : sureImportData)}
          >
            确认导入
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default InputDataModal;
