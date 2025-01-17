import React from 'react';
import { Card, Box } from '@chakra-ui/react';
import { useMarkdown } from '@/hooks/useMarkdown';
import Markdown from '@/components/Markdown';

const Empty = ({ intro }: { intro: string }) => {
  const Header = ({ children }: { children: string }) => (
    <Box fontSize={'lg'} fontWeight={'bold'} textAlign={'center'} pb={2}>
      {children}
    </Box>
  );
  const { data: chatProblem } = useMarkdown({ url: '/chatProblem.md' });
  const { data: versionIntro } = useMarkdown({ url: '/versionIntro.md' });

  return (
    <Box
      minH={'100%'}
      w={'85%'}
      maxW={'600px'}
      m={'auto'}
      py={'5vh'}
      alignItems={'center'}
      justifyContent={'center'}
    >
      {!!intro && (
        <Card p={4} mb={10}>
          <Header>模型介绍</Header>
          <Box whiteSpace={'pre-line'}>{intro}</Box>
        </Card>
      )}
      {/* version intro */}
      <Card p={4} mb={10}>
        <Markdown source={versionIntro} />
      </Card>
      <Card p={4}>
        <Markdown source={chatProblem} />
      </Card>
    </Box>
  );
};

export default Empty;
