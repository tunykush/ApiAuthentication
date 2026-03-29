'use client';
import React, { useState } from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import Link from 'next/link';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    label: (
      <Link href="/" rel="noopener noreferrer">
        Home
      </Link>
    ),
    key: 'Home',
  },
  {
    label: (
      <Link href="/autograde" rel="noopener noreferrer">
        Autograde
      </Link>
    ),
    key: 'Autograde',
  },
  {
    label: (
      <Link href="/consultancy" rel="noopener noreferrer">
        Consultancy
      </Link>
    ),
    key: 'Consultancy',
  },
  {
    label: (
      <Link href="/signin" rel="noopener noreferrer">
        Login
      </Link>
    ),
    key: 'Login',
  },
];

const HomePage: React.FC = () => {
  const [current, setCurrent] = useState('Home');

  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
    setCurrent(e.key);
  };

  return <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />;
};

export default HomePage;