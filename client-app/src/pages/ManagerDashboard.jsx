import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [myDepartment, setMyDepartment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // DATA
    const [deptMembers, setDeptMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    // UI CONTROLS
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectTab, setProjectTab] = useState('TASKS');
    
    // MODAL STATE
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    
    // FORMS
    const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', priority: 'MEDIUM', assigneeId: '' });
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');

    useEffect(() => {
        const userJson = localStorage.getItem('user');
        if (!userJson) { navigate('/'); return; }
        try {
            const userObj = JSON.parse(userJson);
            fetchManagerInfo(userObj.id);
        } catch (e) { navigate('/'); }
    }, []);

    const fetchManagerInfo = async (userId) => {
        setIsLoading(true);
        try {
            const res = await axios.get('http://localhost:8080/api/users');
            // Dùng == để so sánh ID (tránh lỗi string vs number)
            const foundUser = res.data.find(u => u.id == userId);
            
            if (foundUser) {
                setCurrentUser(foundUser);
                if (foundUser.department) {
                    setMyDepartment(foundUser.department);
                    await fetchDeptData(foundUser.department.id);
                }
            }
        } catch (err) { 
            console.error("Lỗi tải dữ liệu user:", err); 
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDeptData = async (deptId) => {
        try {
            const [usersRes, projectsRes] = await Promise.all([
                axios.get('http://localhost:8080/api/users'),
                axios.get('http://localhost:8080/api/projects')
            ]);
            
            // 🔥 SỬA: Dùng == để so sánh ID
            const members = usersRes.data.filter(u => 
                u.department && 
                u.department.id == deptId && 
                u.role === 'EMPLOYEE'
            );
            setDeptMembers(members);
            
            // 🔥 SỬA: Lọc dự án (cả dự án tạo bởi deptId hoặc object department)
            setProjects(projectsRes.data.filter(p => {
                const pDeptId = p.deptId || (p.department ? p.department.id : null);
                return pDeptId == deptId;
            }));
        } catch (err) { console.error("Lỗi tải dữ liệu phòng:", err); }
    };

    const handleSelectProject = async (project) => {
        setSelectedProject(project);
        setActiveTab('PROJECT_DETAIL');
        try {
            const res = await axios.get(`http://localhost:8080/api/tasks/project/${project.id}`);
            // 🔥 SỬA: Đảm bảo tasks luôn là mảng để tránh crash
            setTasks(Array.isArray(res.data) ? res.data : []);
        } catch (e) { 
            setTasks([]); // Nếu lỗi thì set rỗng
            console.error(e); 
        }
    };

    const handleCompleteProject = async () => {
        if (!window.confirm("⚠️ CẢNH BÁO: Dự án sẽ chuyển sang trạng thái 'ĐÃ ĐÓNG'. Bạn có chắc chắn không?")) return;
        try {
            await axios.put(`http://localhost:8080/api/projects/${selectedProject.id}/complete`);
            alert("🎉 Chúc mừng! Dự án đã hoàn thành và đóng lại.");
            const updatedProject = { ...selectedProject, status: 'CLOSED' };
            setSelectedProject(updatedProject);
            // Cập nhật lại list projects bên ngoài
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        } catch (err) { alert("Lỗi: " + err.message); }
    };

    const handleAddMember = async () => {
        if (!selectedMemberToAdd) return alert("Vui lòng chọn nhân viên!");
        try {
            await axios.post(`http://localhost:8080/api/projects/${selectedProject.id}/add-member/${selectedMemberToAdd}`);
            alert("✅ Đã thêm thành công!");
            setShowMemberModal(false);
            setSelectedMemberToAdd('');
            
            // Reload dữ liệu phòng để cập nhật lại danh sách
            await fetchDeptData(myDepartment.id);
            
            // Reload lại project hiện tại để thấy member mới
            const res = await axios.get('http://localhost:8080/api/projects');
            const updated = res.data.find(p => p.id == selectedProject.id);
            if(updated) setSelectedProject(updated);
            
        } catch (err) { 
            alert("Lỗi: " + (err.response?.data || "Thất bại")); 
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:8080/api/tasks/create?projectId=${selectedProject.id}&assigneeId=${newTask.assigneeId}`, newTask);
            alert("✅ Giao việc thành công!");
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', deadline: '', priority: 'MEDIUM', assigneeId: '' });
            const res = await axios.get(`http://localhost:8080/api/tasks/project/${selectedProject.id}`);
            setTasks(Array.isArray(res.data) ? res.data : []);
        } catch (err) { alert("Lỗi: " + (err.response?.data || err.message)); }
    };

    const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

    // --- RENDER ---

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    if (!currentUser || !myDepartment) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light flex-column">
                <h3 className="text-danger fw-bold">⚠️ Lỗi Tài Khoản</h3>
                <p>Tài khoản Manager chưa được gán Phòng ban hoặc không tìm thấy dữ liệu.</p>
                <button onClick={handleLogout} className="btn btn-dark btn-sm mt-2">Đăng xuất</button>
            </div>
        );
    }

    const isProjectClosed = selectedProject?.status === 'CLOSED';

    // 🔥 LỌC NHÂN VIÊN ĐỂ THÊM (Loại bỏ người đã có trong dự án)
    // Dùng ?. và || [] để tránh lỗi màn hình trắng nếu project chưa load xong members
    const availableMembers = deptMembers.filter(u => {
        const currentMembers = selectedProject?.members || []; 
        return !currentMembers.some(m => m.id === u.id);
    });

    return (
        <div className="min-vh-100 bg-light d-flex flex-column" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow px-4 w-100">
                <div className="container-fluid">
                    <div className="d-flex align-items-center text-white">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: 40, height: 40}}><i className="bi bi-briefcase-fill"></i></div>
                        <div><div className="fw-bold">TRƯỞNG PHÒNG</div><div className="small opacity-75">{myDepartment.name}</div></div>
                    </div>
                    <div className="ms-auto d-flex align-items-center gap-3">
                        <span className="text-white small">Xin chào, <b>{currentUser.fullName}</b></span>
                        <button onClick={handleLogout} className="btn btn-outline-light btn-sm px-3 rounded-pill">Đăng xuất</button>
                    </div>
                </div>
            </nav>

            <div className="container-fluid px-4 py-4 flex-grow-1">
                {activeTab === 'PROJECT_DETAIL' && <button onClick={() => setActiveTab('DASHBOARD')} className="btn btn-link text-decoration-none fw-bold mb-3 ps-0 text-dark"><i className="bi bi-arrow-left"></i> Quay lại Dashboard</button>}
                
                {activeTab === 'DASHBOARD' && (
                    <>
                        <div className="row g-4 mb-5">
                            <div className="col-12 col-md-4"><div className="card border-0 shadow-sm p-3 h-100 border-start border-primary border-5"><div className="text-muted small fw-bold">TỔNG NHÂN VIÊN</div><div className="display-6 fw-bold text-dark">{deptMembers.length}</div></div></div>
                            <div className="col-12 col-md-4"><div className="card border-0 shadow-sm p-3 h-100 border-start border-success border-5"><div className="text-muted small fw-bold">DỰ ÁN ĐANG CHẠY</div><div className="display-6 fw-bold text-dark">{projects.filter(p => p.status !== 'CLOSED').length}</div></div></div>
                            <div className="col-12 col-md-4"><div className="card border-0 shadow-sm p-3 h-100 bg-primary text-white"><div className="opacity-75 small fw-bold">HÔM NAY</div><div className="fs-5 mt-2">Chúc bạn một ngày làm việc hiệu quả! 🚀</div></div></div>
                        </div>
                        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-folder2-open me-2"></i>Danh Sách Dự Án</h5>
                        <div className="row g-4">
                            {projects.map(p => (
                                <div key={p.id} className="col-md-6 col-lg-3">
                                    <div
  className={`card border-0 shadow-sm h-100 transition ${
    p.status === 'CLOSED' ? 'opacity-75' : 'hover-shadow'
  }`}
  style={{ cursor: p.status === 'CLOSED' ? 'default' : 'pointer' }}
  onClick={p.status !== 'CLOSED' ? () => handleSelectProject(p) : undefined}
>

                                        <div className={`card-body ${p.status === 'CLOSED' ? 'bg-secondary bg-opacity-10' : ''}`}>
                                            <div className="d-flex justify-content-between mb-2">
                                                {p.status === 'CLOSED' ? <span className="badge bg-secondary">🔒 ĐÃ ĐÓNG</span> : <span className={`badge ${p.priority === 'HIGH' ? 'bg-danger' : p.priority === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info'}`}>{p.priority}</span>}
                                                <small className="text-muted"><i className="bi bi-clock"></i> {p.deadline}</small>
                                            </div>
                                            <h5 className={`fw-bold mb-1 ${p.status === 'CLOSED' ? 'text-muted text-decoration-line-through' : 'text-primary'}`}>{p.name}</h5>
                                            <p className="text-muted small mb-3 text-truncate">{p.description}</p>
                                            <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                                <div className="d-flex align-items-center"><div className="bg-light rounded-circle text-center small fw-bold text-secondary me-1" style={{width: 30, height: 30, lineHeight:'30px'}}>{(p.members || []).length}</div><small className="text-muted">thành viên</small></div>
                                                <button
  className="btn btn-sm btn-outline-primary rounded-pill px-3"
  onClick={(e) => {
    e.stopPropagation();   // 🔥 CỐT LÕI LỖI CỦA BẠN
    handleSelectProject(p);
  }}
>
  Chi tiết
</button>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'PROJECT_DETAIL' && selectedProject && (
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="card border-0 shadow-lg overflow-hidden">
                                <div className={`card-header p-4 border-bottom ${isProjectClosed ? 'bg-secondary text-white' : 'bg-white'}`}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <h2 className={`fw-bold mb-0 ${isProjectClosed ? 'text-white' : 'text-primary'}`}>{selectedProject.name}</h2>
                                                {isProjectClosed && <span className="badge bg-dark border fs-6">🔒 ĐÃ ĐÓNG</span>}
                                            </div>
                                            <p className={`${isProjectClosed ? 'text-white-50' : 'text-muted'} mb-0`}>{selectedProject.description}</p>
                                        </div>
                                        <div>
                                            {!isProjectClosed && <button className="btn btn-outline-danger fw-bold me-3" onClick={handleCompleteProject}><i className="bi bi-check-circle-fill me-2"></i>HOÀN THÀNH DỰ ÁN</button>}
                                            <span className={`badge ${isProjectClosed ? 'bg-dark' : 'bg-light text-dark border'} px-3 py-2 fs-6`}>Hạn: {selectedProject.deadline}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2 mt-4">
                                        <button className={`btn rounded-pill px-4 fw-bold ${projectTab === 'TASKS' ? (isProjectClosed ? 'btn-light text-dark' : 'btn-primary') : 'btn-outline-light text-dark bg-white opacity-75'}`} onClick={()=>setProjectTab('TASKS')}><i className="bi bi-list-check me-2"></i>Công việc ({(tasks || []).length})</button>
                                        <button className={`btn rounded-pill px-4 fw-bold ${projectTab === 'MEMBERS' ? (isProjectClosed ? 'btn-light text-dark' : 'btn-primary') : 'btn-outline-light text-dark bg-white opacity-75'}`} onClick={()=>setProjectTab('MEMBERS')}><i className="bi bi-people-fill me-2"></i>Thành viên ({(selectedProject.members || []).length})</button>
                                    </div>
                                </div>

                                <div className="card-body p-4 bg-light">
                                    {projectTab === 'TASKS' && (
                                        <>
                                            {!isProjectClosed ? (
                                                <div className="d-flex justify-content-end mb-3"><button className="btn btn-success fw-bold shadow-sm" onClick={() => setShowTaskModal(true)}><i className="bi bi-plus-lg me-2"></i>Giao Việc Mới</button></div>
                                            ) : (
                                                <div className="alert alert-secondary text-center fw-bold"><i className="bi bi-lock-fill me-2"></i>Dự án này đã đóng. Bạn chỉ có thể xem lại lịch sử công việc.</div>
                                            )}
                                            
                                            {/* 🔥 FIX TRẮNG TRANG: Thêm || [] */}
                                            <div className="table-responsive bg-white rounded shadow-sm">
                                                <table className="table table-hover align-middle mb-0">
                                                    <thead className="table-light"><tr><th>Task</th><th>Giao cho</th><th>Deadline</th><th>Trạng thái</th><th>Tiến độ</th></tr></thead>
                                                    <tbody>
                                                        {(tasks || []).map(t => (
                                                            <tr key={t.id}>
                                                                <td className="fw-bold">{t.title}</td>
                                                                <td><div className="d-flex align-items-center"><div className="bg-primary text-white rounded-circle text-center small me-2" style={{width: 25, height: 25, lineHeight:'25px'}}>{t.assignee?.fullName ? t.assignee.fullName.charAt(0) : "?"}</div>{t.assignee?.fullName}</div></td>
                                                                <td>{t.deadline}</td>
                                                                <td><span className={`badge ${t.status === 'DONE' ? 'bg-success' : 'bg-secondary'}`}>{t.status}</span></td>
                                                                <td><div className="d-flex align-items-center gap-2"><div className="progress flex-grow-1" style={{height: 6}}><div className="progress-bar bg-info" style={{width: `${t.completionPercentage}%`}}></div></div><small className="fw-bold">{t.completionPercentage}%</small></div></td>
                                                            </tr>
                                                        ))}
                                                        {(!tasks || tasks.length === 0) && <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có công việc nào</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                    {projectTab === 'MEMBERS' && (
                                        <>
                                            {!isProjectClosed && <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary fw-bold shadow-sm" onClick={() => setShowMemberModal(true)}><i className="bi bi-person-plus-fill me-2"></i>Thêm Thành Viên</button></div>}
                                            <div className="row g-3">
                                                {/* 🔥 FIX TRẮNG TRANG: Thêm || [] */}
                                                {(selectedProject.members || []).length > 0 ? (
                                                    (selectedProject.members || []).map(m => (
                                                        <div key={m.id} className="col-md-4 col-lg-3"><div className="bg-white p-3 rounded shadow-sm d-flex align-items-center"><div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold me-3" style={{width: 50, height: 50, fontSize: '1.2rem'}}>{m.fullName.charAt(0)}</div><div><h6 className="fw-bold mb-0">{m.fullName}</h6><small className="text-muted">{m.email}</small><div className="mt-1"><span className="badge bg-secondary">Employee</span></div></div></div></div>
                                                    ))
                                                ) : <div className="col-12 text-center text-muted">Chưa có thành viên nào.</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL THÊM THÀNH VIÊN */}
            {showMemberModal && !isProjectClosed && (
                <div className="modal-backdrop-custom">
                    <div className="card shadow-lg border-0" style={{width: 450}}>
                        <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                            <span>Thêm nhân viên</span>
                            <button className="btn-close btn-close-white" onClick={()=>setShowMemberModal(false)}></button>
                        </div>
                        <div className="card-body">
                            {availableMembers.length > 0 ? (
                                <>
                                    <select className="form-select mb-3" size="5" value={selectedMemberToAdd} onChange={e => setSelectedMemberToAdd(e.target.value)}>
                                        {availableMembers.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                                        ))}
                                    </select>
                                    <button className="btn btn-primary w-100 fw-bold" onClick={handleAddMember} disabled={!selectedMemberToAdd}>Xác nhận</button>
                                </>
                            ) : (
                                <div className="text-center py-3 text-muted">Tất cả nhân viên đã tham gia.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {showTaskModal && !isProjectClosed && (
                <div className="modal-backdrop-custom"><div className="card shadow-lg border-0" style={{width: 500}}><div className="card-header bg-success text-white fw-bold d-flex justify-content-between"><span>Giao việc mới</span><button className="btn-close btn-close-white" onClick={()=>setShowTaskModal(false)}></button></div><div className="card-body"><form onSubmit={handleCreateTask}><input className="form-control mb-2" placeholder="Tiêu đề" required value={newTask.title} onChange={e=>setNewTask({...newTask, title: e.target.value})}/><textarea className="form-control mb-2" placeholder="Mô tả" rows="2" value={newTask.description} onChange={e=>setNewTask({...newTask, description: e.target.value})}/><div className="row mb-2"><div className="col-6"><input type="date" className="form-control" required value={newTask.deadline} onChange={e=>setNewTask({...newTask, deadline: e.target.value})}/></div><div className="col-6"><select className="form-select" value={newTask.priority} onChange={e=>setNewTask({...newTask, priority: e.target.value})}><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option></select></div></div><select className="form-select mb-4" required value={newTask.assigneeId} onChange={e=>setNewTask({...newTask, assigneeId: e.target.value})}><option value="">-- Giao cho ai? --</option>{(selectedProject.members || []).map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}</select><button className="btn btn-success w-100 fw-bold">LƯU</button></form></div></div></div>
            )}
            <style>{`.modal-backdrop-custom { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1050; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); } .hover-shadow:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; } .transition { transition: all 0.3s ease; }`}</style>
        </div>
    );
};
export default ManagerDashboard;