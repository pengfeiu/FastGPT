import React from 'react';
import type { IconProps } from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';

const map = {
  model: require('./icons/model.svg').default,
  share: require('./icons/share.svg').default,
  home: require('./icons/home.svg').default,
  menu: require('./icons/menu.svg').default,
  pay: require('./icons/pay.svg').default,
  copy: require('./icons/copy.svg').default,
  chatSend: require('./icons/chatSend.svg').default,
  board: require('./icons/board.svg').default,
  develop: require('./icons/develop.svg').default,
  user: require('./icons/user.svg').default,
  chatting: require('./icons/chatting.svg').default
};

export type IconName = keyof typeof map;

const MyIcon = ({ name, w = 'auto', h = 'auto', ...props }: { name: IconName } & IconProps) => {
  return map[name] ? (
    <Icon as={map[name]} w={w} h={h} boxSizing={'content-box'} verticalAlign={'top'} {...props} />
  ) : null;
};

export default MyIcon;
