import Head from 'next/head'
import Link from 'next/link';
import Chat from '@/components/chat/Chat';
import Conversations from '@/components/conversations/Conversations';
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import withAuth from '../components/withAuth/WithAuth';
import { useRouter } from 'next/router';

const Home = () => {
  const { user, authToken, logout, loading } = useContext(AuthContext);

  const router = useRouter();

  useEffect(() => {
    //Check if the user is logged in after we are done loading
    if (!loading && !user) {
      router.push('/login');
    }

  }, [user, authToken, loading]);

  return (
    <>
      <Head>
        <title>Chat and notebook</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div className="main-container">
          <div className="main-container__left" id="main-container__left">
            <Conversations />
          </div>
          <div className="main-container__right">
            <Chat />
          </div>
        </div>
      </main>
    </>
  )
}

export default withAuth(Home);