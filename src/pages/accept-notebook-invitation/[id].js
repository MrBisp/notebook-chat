import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import WorkbookInvitation from '../../components/workbook-invitation/WorkbookInvitation';

const WorkbookInvitationPage = () => {

    const router = useRouter();
    const { id } = router.query;

    const [invitation, setInvitation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            // Fetch the workbook invitation details using the provided ID
            fetch(`/api/workbook-invitation/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setInvitation(data.invitation);
                    } else {
                        console.log(data.error);
                        setError(data.error);
                    }
                })
        }
    }, [id]);

    return (
        <>
            {invitation && <WorkbookInvitation invitation={invitation} errorInvitation={error} />}
            {error && <WorkbookInvitation invitation={invitation} errorInvitation={error} />}
        </>
    )
}

export default WorkbookInvitationPage;
