import Main from "@/components/main/Main"
import WorkbookPages from "@/components/workbook-pages/WorkbookPages";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

const sharedPages = () => {
    const { pagesSharedWithUser, workbook } = useContext(AuthContext);

    return (
        <Main middle={<>
            <div className="main-container__right">
                <div className="show-all-pages">
                    <div className='all-pages-header'>
                        <h1>Shared with you</h1>
                    </div>
                    <WorkbookPages pages={pagesSharedWithUser} workbook={workbook} />
                </div>
            </div>
        </>} />
    )
}

export default sharedPages;