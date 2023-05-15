import { useState } from "react";
import Register from "../register/Register";
import Login from '../login/Login';

export default function SigninRegisterModal({ startWithRegister = false }) {
    const [showRegister, setShowRegister] = useState(startWithRegister);
    const [showSignin, setShowSignin] = useState(!startWithRegister);

    function signInFunction() {
        setShowSignin(true);
        setShowRegister(false);
    }

    function registerFunction() {
        setShowRegister(true);
        setShowSignin(false);
    }

    return (
        <div className="signin-register-modal">
            {showRegister && <Register signInFunction={signInFunction} />}
            {showSignin && <Login registerFunction={registerFunction} />}
        </div>
    )
}