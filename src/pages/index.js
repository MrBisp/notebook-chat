import Head from 'next/head'
import { useState, useEffect } from 'react';
import Link from 'next/link';

const Home = () => {

  useEffect(() => {

    //Check if the user is logged in after we are done loading
    if (!loading && !user) {
      console.log('User is not logged in, redirecting to login page');
      router.push('/login');
    }
  }, []);

  return (
    <>
      <Head>
        <title>Chat and notebook</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Chat and notebook</h1>
        <p>
          Log in to use Notebook Chat!
          <Link href="/login">Log in</Link>
        </p>
      </main>
    </>
  )
}

export default Home;