import Main from "@/components/main/Main";
import ChatFullscreen from "@/components/chat-fullscreen/Chat-Fullscreen";

export default function Chat() {
    return (
        <Main middle={<ChatFullscreen />} />
    )
}