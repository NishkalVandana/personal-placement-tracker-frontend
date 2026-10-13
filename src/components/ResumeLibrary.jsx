import { useEffect,useState } from "react"
import { ui, Alert, EmptyState, LoadingState, Modal, Spinner, formatDate } from "./ui"
import { API_URL } from "../config";
function ResumeLibrary(){
    const [refresh,setRefresh]=useState(false)
    const [loading,setLoading]=useState(true)
    const [loadError,setLoadError]=useState("")
    const [notice,setNotice]=useState(null)
    const [saving,setSaving]=useState(false)
    useEffect(
        ()=>{fetch(`${API_URL}/resumes`,{
            method:"GET",
            headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            }
        }).then(response=>response.json())
        .then(data=>{
            console.log(data)
            setResumes(data)
        })
        .catch(()=>setLoadError("Couldn't load your resumes. Check that the server is running and try again."))
        .finally(()=>setLoading(false))
        },
        [refresh]
    )
    const [model,setModel]=useState(false)
    const [resume,setResume]=useState({
        "resumeName":"",
        "category":"",
        "url":"",
    })
    const [resumes,setResumes]=useState([])
    const openModal = () => {
        setModel(true);
    };

    const closeModal = () => {
        setModel(false);
    };
    const handleSave=async(e)=>{
        e.preventDefault()
        setSaving(true)
        try {
        const response = await fetch(`${API_URL}/resumes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(resume)
        });
        const data=await response.json()
        setNotice(response.ok
            ? {type:"success",text:"Resume added."}
            : {type:"error",text:data.msg || data.message || data.error || "Couldn't add the resume."})
        setModel(false)
        console.log(data)
        setRefresh(!refresh)
        setResume({
        "resumeName":"",
        "category":"",
        "url":"",
        })
        } finally {
            setSaving(false)
        }
    }
    const handleChange=(e)=>{
        setResume({...resume,[e.target.name]:e.target.value})
    }
    const handleOpen=(resume)=>{
        window.open(resume.url)
    }
    const handleDelete=async(resume)=>{
        const response=await fetch(`${API_URL}/resumes/${resume._id}`,{
                    method:"DELETE",
                    headers:{
                        "Authorization":`Bearer ${localStorage.getItem("access_token")}`
                    }
                    }
                )
        const data=await response.json();
        console.log(data)
        setNotice(response.ok
            ? {type:"success",text:"Resume deleted."}
            : {type:"error",text:"Couldn't delete the resume."})
        setRefresh(!refresh)
        }

    // Display-only guard in case the API returns a non-array (e.g. an auth error object)
    const list = Array.isArray(resumes) ? resumes : []

    return(
    <div className={`${ui.page} min-h-[calc(100vh-4rem)]`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className={ui.pageTitle}>Resumes</h1>
                <p className={ui.pageSubtitle}>
                    {list.length} {list.length === 1 ? "resume" : "resumes"} in your library
                </p>
            </div>
            <button onClick={openModal} className={ui.btnPrimary}>
                + Add resume
            </button>
        </div>

        <div className="mt-6 space-y-4">
            {notice && (
                <Alert type={notice.type} onDismiss={()=>setNotice(null)}>{notice.text}</Alert>
            )}
            {loadError && <Alert type="error">{loadError}</Alert>}
        </div>

        {/*Resumes section  */}
        <div className="mt-6">
            {loading ? (
                <LoadingState label="Loading resumes…" />
            ) : list.length === 0 ? (
                <EmptyState
                    title="No resumes yet"
                    description="Save links to your Google Drive resumes here so you can attach the right one to each application."
                    action={
                        <button onClick={openModal} className={ui.btnPrimary}>
                            + Add resume
                        </button>
                    }
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((resume,index)=>{
                        return <div key={resume._id} className={`${ui.card} flex flex-col p-5 transition hover:shadow-md`}>
                            <p className="truncate text-base font-semibold text-slate-900">{resume.resumeName}</p>
                            <div className="mt-2">
                                <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                                    {resume.category}
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-slate-500">Added {formatDate(resume.date)}</p>
                            <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                                <button onClick={()=>handleOpen(resume)} className={`${ui.btnPrimary} flex-1`}>
                                    Open
                                </button>
                                <button onClick={()=>handleDelete(resume)} className={`${ui.btnDanger} flex-1`}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    })}
                </div>
            )}
        </div>

        {model && (
            <Modal title="Add resume" onClose={closeModal} maxWidth="max-w-lg">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="resumeName" className={ui.label}>Resume name</label>
                        <input id="resumeName" value={resume.resumeName} name="resumeName" onChange={handleChange} className={ui.input}></input>
                    </div>
                    <div>
                        <label htmlFor="category" className={ui.label}>Category</label>
                        
                        <select
                            id="category"
                            name="category"
                            onChange={handleChange}
                            value={resume.category}
                            className={ui.input}
                        >
                            <option value="" disabled>
                                Select category
                            </option>

                            <option value="Frontend Developer">Frontend Developer</option>
                            <option value="Backend Developer">Backend Developer</option>
                            <option value="FullStack Developer">Full Stack Developer</option>
                            <option value="Software Developer">Software Developer (SDE)</option>
                            <option value="Java Developer">Java Developer</option>
                            <option value="Python Developer">Python Developer</option>
                            <option value="MERN Stack Developer">MERN Stack Developer</option>
                            <option value="Flask Developer">Flask Developer</option>
                            <option value="QA">Quality Analyst (QA)</option>
                            <option value="Automation Tester">Automation Tester</option>
                            <option value="Manual Tester">Manual Tester</option>
                            <option value="SDET">Software Development Engineer in Test (SDET)</option>
                            <option value="Data Analyst">Data Analyst</option>
                            <option value="Data Scientist">Data Scientist</option>
                            <option value="AI/ML Engineer">AI/ML Engineer</option>
                            <option value="DevOps Engineer">DevOps Engineer</option>
                            <option value="Cloud Engineer">Cloud Engineer</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                            <option value="Internship">Internship</option>
                            <option value="General">General / Fresher</option>
                            <option value="Other">Other</option>
                        </select>

                    </div>
                    <div>
                        <label htmlFor="url" className={ui.label}>Google Drive URL</label>
                        <input id="url" value={resume.url} name="url" type="url" placeholder="https://drive.google.com/…" className={ui.input} onChange={handleChange}></input>
                    </div>
                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button onClick={closeModal} type="button" className={ui.btnSecondary}>Cancel</button>
                        <button type="submit" disabled={saving} className={ui.btnPrimary}>
                            {saving && <Spinner />}
                            {saving ? "Saving…" : "Save resume"}
                        </button>
                    </div>
                </form>
            </Modal>
        )}
    </div>
    );
}
export default ResumeLibrary
