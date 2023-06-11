import React from 'react';
import Styles from './Mobile-Bottom-Navbar.module.css';
import { MdHome, MdOutlineAssignment, MdMenuBook, MdChat, MdEditNote } from 'react-icons/md';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MobileBottomNavbar = ({ showPages, showWrite, showChat }) => {
    const router = useRouter();

    const homeClickHandler = () => {
        router.push('/notebook');
    }






    return (
        <div className={Styles.MobileBottomNavbar}>
            <div className={Styles.MobileBottomNavbar__item} onClick={homeClickHandler}>
                <div className={Styles.MobileBottomNavbar__item__icon}>
                    <MdHome />
                </div>
                <div className={Styles.MobileBottomNavbar__item__text}>
                    Home
                </div>
            </div>
            <div className={Styles.MobileBottomNavbar__item} onClick={showPages}>
                <div className={Styles.MobileBottomNavbar__item__icon}>
                    <MdOutlineAssignment />
                </div>
                <div className={Styles.MobileBottomNavbar__item__text}>
                    Pages
                </div>
            </div>
            <div className={Styles.MobileBottomNavbar__item} onClick={showWrite}>
                <div className={Styles.MobileBottomNavbar__item__icon}>
                    <MdEditNote />
                </div>
                <div className={Styles.MobileBottomNavbar__item__text}>
                    Write
                </div>
            </div>
            <div className={Styles.MobileBottomNavbar__item} onClick={showChat}>
                <div className={Styles.MobileBottomNavbar__item__icon}>
                    <MdChat />
                </div>
                <div className={Styles.MobileBottomNavbar__item__text}>
                    Chat
                </div>
            </div>


        </div>
    )
}

export default MobileBottomNavbar;