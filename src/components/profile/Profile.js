import styles from './Profile.module.css';
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { set } from 'mongoose';

const Profile = () => {
    const { settings, updateSettings, memories, createMemory, deleteMemory } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState('settings');
    const [gptVersion, setGptVersion] = useState('');
    const [changes, setChanges] = useState([]);

    const [showCreateMemory, setShowCreateMemory] = useState(false);
    const [newMemory, setNewMemory] = useState('');

    const gptVersions = [
        {
            name: 'GPT 3.5',
            value: 'gpt-3.5-turbo'
        },
        {
            name: 'GPT 4',
            value: 'gpt-4'
        }
    ]

    useEffect(() => {
        if (settings) {
            console.log(settings)
            const gptVersionSetting = settings.find(setting => setting?.setting === 'gpt-version');
            if (gptVersionSetting) {
                setGptVersion(gptVersionSetting.value);
            }
        }
    }, [settings])

    return (
        <div className={styles.profile}>
            <div className={styles.profile__container}>
                <div className={styles.profile_left}>
                    <div className={styles.button} style={
                        activeTab === 'settings' ? { backgroundColor: 'rgba(0,0,0,0.05)' } : { backgroundColor: 'rgba(0,0,0,0.0)' }
                    } onClick={() => { setActiveTab('settings') }}>
                        <span>Settings</span>
                    </div>
                    <div className={styles.button} style={
                        activeTab === 'memories' ? { backgroundColor: 'rgba(0,0,0,0.05)' } : { backgroundColor: 'rgba(0,0,0,0.0)' }
                    } onClick={() => { setActiveTab('memories') }}>
                        <span>Memories</span>
                    </div>
                </div>
                <div className={styles.profile_right}>
                    {
                        activeTab === 'settings' && (
                            <div className={styles.settings}>
                                <h3>Settings</h3>
                                <div className={styles.settings__container}>
                                    <div className={styles.setting}>
                                        <span>GPT version</span>
                                        <select
                                            value={gptVersion}
                                            onChange={(e) => {
                                                setGptVersion(e.target.value);
                                                const setting = settings.find(setting => setting?.setting === 'gpt-version');
                                                setChanges([...changes, {
                                                    _id: setting._id,
                                                    value: e.target.value
                                                }])
                                            }}>
                                            {
                                                gptVersions.map((version, index) => (
                                                    <option key={index} value={version.value}>{version.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className={styles.saveButton}>
                                        <button onClick={() => { updateSettings(changes) }}>Save</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {
                        activeTab === 'memories' && (
                            <div className={styles.memories}>
                                <h3>Memories</h3>
                                <div className={styles.memories__container}>
                                    {
                                        memories.map((memory, index) => (
                                            <div key={index} className={styles.memory}>
                                                <span>{memory.memory}</span>
                                                <div className={styles.memory__buttons}>
                                                    <button onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this memory?')) {
                                                            deleteMemory(memory._id);
                                                        }
                                                    }}>Delete</button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {
                                        showCreateMemory && (
                                            <div className={styles.createMemory}>
                                                <textarea
                                                    value={newMemory}
                                                    onChange={(e) => { setNewMemory(e.target.value) }}
                                                />
                                                <div className={styles.create_memory_buttons}>
                                                    <button onClick={() => { setShowCreateMemory(false) }}>Cancel</button>
                                                    <button onClick={() => {
                                                        createMemory(newMemory);
                                                        setShowCreateMemory(false);
                                                        setNewMemory('');
                                                    }}>Save</button>
                                                </div>
                                            </div>
                                        )
                                    }
                                    {
                                        !showCreateMemory && (
                                            <div className={styles.createMemoryButton}>
                                                <button onClick={() => { setShowCreateMemory(true) }}>Create new memory</button>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Profile;