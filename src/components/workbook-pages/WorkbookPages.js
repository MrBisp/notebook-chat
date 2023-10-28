import React, { useState, useContext } from 'react';
import Link from 'next/link';
import { MdMoreVert } from 'react-icons/md';
import { AuthContext } from '../../context/AuthContext';

const WorkbookPages = ({ pages, workbook }) => {
    const { deletePage } = useContext(AuthContext);

    const [showPageEdit, setShowPageEdit] = useState(false);

    return (
        <>
            {
                pages.map((page) =>
                    <>
                        <Link href={
                            workbook ? `/notebook/${workbook._id}/page/${page._id}` : `/page/${page._id}`
                        } key={page._id} className="notebook-page-link">
                            <div key={page._id} className={'notebook-page-link-container'}>
                                <h3>{page.title}</h3>
                                {
                                    workbook ? (
                                        <div className="page-dots">
                                            <MdMoreVert className='three-dots'
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    showPageEdit == page._id ? setShowPageEdit(false) : setShowPageEdit(page._id);
                                                }}
                                            />
                                            {
                                                showPageEdit == page._id && (
                                                    <div className='page-edit'>
                                                        <div className='page-edit-option' style={{ 'color': 'red' }} onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const delPage = confirm('Are you sure, you want to delete this page?');
                                                            if (delPage) {
                                                                //Delete page
                                                                deletePage(page._id, workbook._id)
                                                                setShowPageEdit(false);
                                                            } else {
                                                                return;
                                                            }
                                                        }}>
                                                            <span>Delete page</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    ) : null
                                }
                            </div>
                        </Link>
                    </>
                )
            }
        </>
    )
}

export default WorkbookPages;