import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Invitation from '@/components/invitation/Invitation'

const InvitationPage = () => {

    const router = useRouter();
    const { id } = router.query;

    const [invitation, setInvitation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/invitation/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setInvitation(data.invitation);
                    } else {
                        setError(data.error);
                    }
                })
        }
    }, [id]);


    return (
        <Invitation invitation={invitation} errorInvitation={error} />

    )
}

export default InvitationPage;