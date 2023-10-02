import TiptapCollaboration from "@/components/tiptap-collaboration/Tiptap-Collaboration"
import { useRouter } from "next/router"

const collab = () => {

    const router = useRouter();
    const { id } = router.query;

    return (
        <div>
            <TiptapCollaboration id={id} />
        </div>
    )
}

export default collab;