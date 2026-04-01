import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import { askConfirm } from '../utils/confirm';
import NotificationBell from '../components/NotificationBell';
import Swal from 'sweetalert2';
import AdminStatistics from '../components/AdminStatistics';
import { formatDeptName, normalizeDeptName } from '../utils/formatUtils';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './AdminDashboard.css';

const getProjectTimeStatus = (p) => {
    if (p.status === 'CLOSED') return { text: 'Đã hoàn thành', color: 'bg-success text-white' };
    if (!p.startDate || !p.deadline) return { text: 'Chưa xác định', color: 'bg-secondary text-white' };
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.deadline);
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (now < start) return { text: 'Chưa bắt đầu', color: 'bg-info text-dark' };
    if (now > end) return { text: 'Quá hạn', color: 'bg-danger text-white' };
    return { text: 'Đang thực hiện', color: 'bg-primary text-white' };
};


const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [completedProjects, setCompletedProjects] = useState([]);
    const [deletedProjects, setDeletedProjects] = useState([]);
    const [viewingCompletedProject, setViewingCompletedProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityPage, setActivityPage] = useState(0);
    const [activityTotalPages, setActivityTotalPages] = useState(0);
    const [activityFilters, setActivityFilters] = useState({ adminId: '', actionType: '', startDate: '', endDate: '' });
    const [showLogDetail, setShowLogDetail] = useState(null);

    // Rollback States
    const [undoLog, setUndoLog] = useState(null);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [rollbackCountdown, setRollbackCountdown] = useState(0);
    const [isRollingBack, setIsRollingBack] = useState(false);

    const { tab } = useParams();
    const [activeTab, setActiveTab] = useState(tab || 'users');

    // Synchronize activeTab with URL parameter 'tab'
    useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab) {
            // Default to users if no tab provided
            navigate('/admin/users', { replace: true });
        }
    }, [tab, activeTab]);

    // WebSocket / Rollback Alert Listener
    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('✅ Connected to WebSocket for Rollback Alerts');
                client.subscribe('/topic/admin/rollback', (message) => {
                    const data = JSON.parse(message.body);
                    // Hiển thị thông báo cho Super Admin nếu có người khác rollback
                    if (data.admin !== currentUser.email) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Cảnh báo Khôi phục',
                            text: `${data.admin} vừa khôi phục hành động: "${data.action}"`,
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 5000
                        });
                    }
                });
            }
        });
        client.activate();
        return () => client.deactivate();
    }, []);

    // Countdown Timer for Undo Toast
    useEffect(() => {
        let timer;
        if (showUndoToast && rollbackCountdown > 0) {
            timer = setInterval(() => {
                setRollbackCountdown(prev => prev - 1);
            }, 1000);
        } else if (rollbackCountdown === 0) {
            setShowUndoToast(false);
        }
        return () => clearInterval(timer);
    }, [showUndoToast, rollbackCountdown]);

    const [selectedDept, setSelectedDept] = useState(null);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', googleEmail: '', role: 'EMPLOYEE', deptId: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [newDept, setNewDept] = useState({ name: '', description: '' });
    const [newProject, setNewProject] = useState({ name: '', description: '', startDate: '', deadline: '', priority: 'MEDIUM' });
    const [projectViewMode, setProjectViewMode] = useState('grid');
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [selectedProjectForMember, setSelectedProjectForMember] = useState(null);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
    const [showDeptMemberModal, setShowDeptMemberModal] = useState(false);
    const [selectedDeptForMember, setSelectedDeptForMember] = useState(null);
    const [availableDeptMembers, setAvailableDeptMembers] = useState([]);
    const [selectedDeptMembersToAdd, setSelectedDeptMembersToAdd] = useState([]);

    const [showDeptPersonnelModal, setShowDeptPersonnelModal] = useState(false);
    const [selectedDeptForPersonnel, setSelectedDeptForPersonnel] = useState(null);

    // Pagination and Sorting for Users
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 7;
    const [sortField, setSortField] = useState('fullName');
    const [sortOrder, setSortOrder] = useState('asc');

    // Filters for Users
    const [filterDeptId, setFilterDeptId] = useState('');
    const [filterRole, setFilterRole] = useState('');

    const getVnAction = (type) => {
        const map = {
            'CREATE': { text: 'THÊM MỚI', icon: 'bi-plus-circle', color: 'success' },
            'UPDATE': { text: 'CẬP NHẬT', icon: 'bi-pencil-square', color: 'primary' },
            'DELETE': { text: 'XÓA', icon: 'bi-trash', color: 'danger' },
            'LOGIN': { text: 'ĐĂNG NHẬP', icon: 'bi-box-arrow-in-right', color: 'info' },
            'RESTORE': { text: 'KHÔI PHỤC', icon: 'bi-arrow-counterclockwise', color: 'warning' }
        };
        return map[type] || { text: type, icon: 'bi-info-circle', color: 'secondary' };
    };

    // Rollback Logic
    const fetchLatestLogAndShowUndo = async () => {
        try {
            // Đợi 1 giây để backend aspect xử lý xong
            setTimeout(async () => {
                const res = await api.get(`/admin/activity-logs/latest?adminId=${currentUser.id}`);
                if (res.data) {
                    setUndoLog(res.data);
                    setShowUndoToast(true);
                    setRollbackCountdown(15); // Toast tồn tại 15 giây
                }
            }, 1000);
        } catch (err) {
            console.error('Lỗi lấy log mới nhất:', err);
        }
    };

    const handleRollback = async (logId) => {
        if (!logId) return;

        const result = await Swal.fire({
            title: 'Xác nhận Khôi phục?',
            html: `Hành động này sẽ đảo ngược dữ liệu về trạng thái trước đó.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đồng ý, khôi phục!',
            cancelButtonText: 'Bỏ qua',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    const response = await api.post(`/admin/rollback/${logId}`);
                    return response.data;
                } catch (error) {
                    Swal.showValidationMessage(`Lỗi: ${error.response?.data || error.message}`);
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Dữ liệu đã được khôi phục về trạng thái trước đó.',
                timer: 2000
            });
            setShowUndoToast(false);
            setUndoLog(null);
            // Tải lại toàn bộ dữ liệu ngay lập tức (Yêu cầu: không cần F5)
            await fetchData();
            fetchActivityLogs(activityPage);
        }
    };

    const getVnResource = (type) => {
        const map = {
            'USER': 'NHÂN SỰ',
            'PROJECT': 'DỰ ÁN',
            'DEPARTMENT': 'PHÒNG BAN',
            'TASK': 'CÔNG VIỆC',
            'AUTH': 'HỆ THỐNG',
            'SETTING': 'CẤU HÌNH'
        };
        return map[type] || type;
    };

    const formatLogDescription = (desc, log) => {
        if (!desc) return '';

        // Handle old English format: "Admin X performed Y on Z"
        if (desc.includes('performed') && desc.includes('on')) {
            const adminMatch = desc.match(/Admin (.*) performed/);
            const adminName = adminMatch ? adminMatch[1] : log.adminName;
            const actionVn = getVnAction(log.actionType).text.toLowerCase();
            const resourceVn = getVnResource(log.resourceType).toLowerCase();
            return `Admin ${adminName} đã ${actionVn} ${resourceVn}`;
        }

        return desc;
    };

    const fetchActivityLogs = async (page = 0) => {
        if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) return;
        try {
            const { adminId, actionType, startDate, endDate } = activityFilters;
            let url = `/admin/activity-logs?page=${page}&size=15`;
            if (adminId) url += `&adminId=${adminId}`;
            if (actionType) url += `&actionType=${actionType}`;
            if (startDate) url += `&startDate=${startDate}T00:00:00`;
            if (endDate) url += `&endDate=${endDate}T23:59:59`;

            const res = await api.get(url);
            setActivityLogs(res.data.content);
            setActivityTotalPages(res.data.totalPages);
            setActivityPage(page);
        } catch (err) { console.error("Lỗi tải nhật ký:", err); }
    };

    const fetchData = async () => {
        try {
            const [usersRes, deptsRes, projectsRes, deletedRes] = await Promise.all([
                api.get(`/users/search?keyword=${searchTerm}&deptId=${filterDeptId}&role=${filterRole}&sortBy=${sortField}&order=${sortOrder}`),
                api.get('/departments'),
                api.get('/projects'),
                api.get(`/projects/deleted?adminEmail=${currentUser.email}`)
            ]);
            console.log("Users:", usersRes.data);
            console.log("Departments:", deptsRes.data);
            console.log("Projects:", projectsRes.data);
            console.log("Deleted Projects:", deletedRes.data);

            setUsers(usersRes.data);
            setDepartments(deptsRes.data);
            setProjects(projectsRes.data.filter(p => !p.isDeleted));
            setCompletedProjects(projectsRes.data.filter(p => p.status === 'CLOSED'));
            setDeletedProjects(deletedRes.data);
        } catch (error) { console.error("Lỗi tải dữ liệu:", error); }
    };

    useEffect(() => {
        fetchData();
    }, [sortField, sortOrder, filterDeptId, filterRole]);

    // Reset page when users list changes (due to search, fetch, etc.)
    useEffect(() => {
        setCurrentPage(1);
    }, [users]);

    // Real-time Search with Debounce (300ms)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            try {
                // We always use the search endpoint for convenience if filters are present
                const res = await api.get(`/users/search?keyword=${searchTerm}&deptId=${filterDeptId}&role=${filterRole}&sortBy=${sortField}&order=${sortOrder}`);
                setUsers(res.data);
            } catch (err) { console.error("Lỗi tìm kiếm/lọc:", err); }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line
    }, [searchTerm]);

    const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

    const handleResetSearch = () => { setSearchTerm(''); };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterDeptId('');
        setFilterRole('');
        setCurrentPage(1);
    };

    // Trigger fetch logs when filters or page change
    useEffect(() => {
        if (activeTab === 'activity-logs') {
            fetchActivityLogs(activityPage);
        }
    }, [activeTab, activityFilters, activityPage]);

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
                alert("Vui lòng chọn file ảnh PNG hoặc JPG!");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("Kích thước ảnh không được vượt quá 5MB!");
                return;
            }
            setAvatarFile(file);
            setAvatarUrl('');
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditAvatar = () => {
        document.getElementById('avatarInput').click();
    };

    const handleAvatarUrlChange = (e) => {
        const url = e.target.value;
        setAvatarUrl(url);
        setAvatarFile(null);
        document.getElementById('avatarInput').value = '';
    };

    const handleLoadAvatarFromUrl = () => {
        if (!avatarUrl.trim()) {
            alert("Vui lòng nhập URL ảnh!");
            return;
        }
        const img = new Image();
        img.onload = () => {
            setAvatarPreview(avatarUrl);
            setAvatarFile(null);
        };
        img.onerror = () => {
            alert("Không thể tải ảnh từ URL này. Vui lòng kiểm tra lại!");
            setAvatarUrl('');
            setAvatarPreview(null);
        };
        img.src = avatarUrl;
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarUrl('');
        document.getElementById('avatarInput').value = '';
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            if (avatarFile || avatarUrl) {
                const formData = new FormData();
                formData.append('fullName', newUser.fullName);
                formData.append('email', newUser.email);
                formData.append('password', newUser.password);
                formData.append('role', newUser.role);
                if (newUser.deptId) formData.append('deptId', newUser.deptId);
                if (newUser.googleEmail) formData.append('googleEmail', newUser.googleEmail);
                if (avatarFile) {
                    formData.append('avatar', avatarFile);
                } else if (avatarUrl) {
                    formData.append('avatarUrl', avatarUrl);
                }

                await api.post('/users/create-with-avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                let url = '/users';
                if (newUser.deptId) url += `?deptId=${newUser.deptId}`;
                await api.post(url, newUser);
            }

            alert("Thêm nhân sự thành công!");
            setNewUser({ fullName: '', email: '', password: '', googleEmail: '', role: 'EMPLOYEE', deptId: '' });
            setAvatarFile(null);
            setAvatarPreview(null);
            setAvatarUrl('');
            document.getElementById('avatarInput').value = '';
            await fetchData();
            fetchLatestLogAndShowUndo();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || err.message;
            alert("Lỗi: " + errorMsg);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!(await askConfirm("Xóa nhân viên này?"))) return;
        try {
            await api.delete(`/users/${id}`);
            fetchData();
            fetchLatestLogAndShowUndo();
        } catch (err) { console.error(err); alert("Lỗi xóa!"); }
    };

    const [editingUserId, setEditingUserId] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editDeptId, setEditDeptId] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editGoogleEmail, setEditGoogleEmail] = useState('');

    const handleEditUser = (id) => {
        const user = users.find(u => u.id === id);
        setEditingUserId(id);
        setEditEmail(user.email);
        setEditDeptId(user.department ? user.department.id : '');
        setEditRole(user.role);
        setEditGoogleEmail(user.googleEmail || '');
    };

    const handleSaveEdit = async () => {
        try {
            await api.patch(`/users/${editingUserId}`, {
                email: editEmail,
                deptId: editDeptId,
                role: editRole
            }, {
                params: {
                    adminEmail: currentUser.email
                }
            });
            alert('Cập nhật thành công!');
            fetchData();
            fetchLatestLogAndShowUndo();
            setEditingUserId(null);
        } catch (err) {
            const errorData = err.response?.data;
            const message = typeof errorData === 'string' ? errorData : (errorData?.message || err.message);
            alert('Lỗi: ' + message);
        }
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleAddDept = async (e) => {
        e.preventDefault();
        try {
            const normalizedDept = { ...newDept, name: normalizeDeptName(newDept.name) };
            await api.post('/departments', normalizedDept);
            alert("Thêm phòng thành công!");
            setNewDept({ name: '', description: '' });
            await fetchData();
            fetchLatestLogAndShowUndo();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data || err.message;
            console.error(err);
            alert("Lỗi thêm phòng: " + errorMsg);
        }
    };

    const handleEditDepartment = async (dept) => {
        let availableManagers = users.filter(u => u.role === 'MANAGER');

        const { value: formValues } = await Swal.fire({
            title: `Sửa Thông Tin ${formatDeptName(dept.name)}`,
            html: `
                <div class="text-start">
                    <label class="form-label fw-bold small text-muted">Tên Phòng Ban</label>
                    <input id="swal-edit-dname" class="form-control mb-3" value="${formatDeptName(dept.name).replace('Phòng ', '')}">
                    
                    <label class="form-label fw-bold small text-muted">Mô Tả</label>
                    <textarea id="swal-edit-ddesc" class="form-control mb-3" rows="4">${dept.description || ''}</textarea>

                    <label class="form-label fw-bold small text-muted">Trưởng Phòng</label>
                    <select id="swal-edit-dmanager" class="form-select mb-3">
                        <option value="">-- Chưa có --</option>
                        ${availableManagers.map(m => `<option value="${m.id}" ${(dept.manager?.id === m.id) ? 'selected' : ''}>${m.fullName} (${m.email})</option>`).join('')}
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            preConfirm: () => {
                const name = document.getElementById('swal-edit-dname').value.trim();
                const description = document.getElementById('swal-edit-ddesc').value.trim();
                const managerId = document.getElementById('swal-edit-dmanager').value;
                if (!name) {
                    Swal.showValidationMessage('Tên phòng ban không được để trống!');
                    return false;
                }
                return { name, description, managerId };
            }
        });

        if (formValues) {
            try {
                const updatedPayload = {
                    ...dept,
                    name: normalizeDeptName(formValues.name),
                    description: formValues.description
                };
                if (formValues.managerId) {
                    updatedPayload.manager = { id: formValues.managerId };
                } else {
                    updatedPayload.manager = null;
                }

                await api.put(`/departments/${dept.id}`, updatedPayload);
                await Swal.fire('Thành công', 'Đã cập nhật phòng ban', 'success');
                fetchData();
                fetchLatestLogAndShowUndo();
                if (selectedDept && selectedDept.id === dept.id) {
                    setSelectedDept({ ...selectedDept, name: formValues.name, description: formValues.description });
                }
            } catch (error) {
                Swal.fire("Lỗi", error.response?.data || error.message, "error");
            }
        }
    };

    const handleOpenDeptMemberModal = (dept) => {
        setSelectedDeptForMember(dept);
        let allEmployees = users.filter(u => u.role === 'EMPLOYEE');
        const available = allEmployees.filter(u => !u.department || u.department.id !== dept.id);
        setAvailableDeptMembers(available);
        setSelectedDeptMembersToAdd([]);
        setShowDeptMemberModal(true);
    };

    const handleAddMemberToDept = async () => {
        if (selectedDeptMembersToAdd.length === 0) {
            alert("Vui lòng chọn ít nhất một nhân viên!");
            return;
        }
        try {
            await api.patch(`/users/bulk-update-dept`, selectedDeptMembersToAdd, {
                params: {
                    deptId: selectedDeptForMember.id,
                    adminEmail: currentUser.email
                }
            });
            alert(`✅ Đã thêm ${selectedDeptMembersToAdd.length} nhân viên vào phòng ban!`);
            setShowDeptMemberModal(false);
            setSelectedDeptMembersToAdd([]);
            fetchData();
        } catch (err) {
            console.error("❌ Lỗi thêm member phòng ban:", err);
            alert("Lỗi: " + (err.response?.data?.message || err.response?.data || err.message));
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (await askConfirm('Xóa phòng ban này và toàn bộ dữ liệu liên quan? Hành động này có thể bị từ chối nếu có dự án hoặc nhân sự bám theo!')) {
            try {
                await api.delete(`/departments/${id}`);
                alert("Đã xóa phòng ban!");
                fetchData();
                fetchLatestLogAndShowUndo();
                if (selectedDept && selectedDept.id === id) {
                    setSelectedDept(null);
                }
            } catch (error) {
                alert("Lỗi xóa: " + (error.response?.data || error.message));
            }
        }
    };

    const handleEditProject = async (p) => {
        const { value: formValues } = await Swal.fire({
            title: 'Sửa thông tin dự án',
            html: `
                <div class="text-start">
                    <label class="form-label fw-bold small text-muted">Tên Dự Án</label>
                    <input id="swal-edit-pname" class="form-control mb-3" value="${p.name || ''}" placeholder="Tên dự án">
                    
                    <label class="form-label fw-bold small text-muted">Mô Tả</label>
                    <textarea id="swal-edit-pdesc" class="form-control mb-3" rows="3" placeholder="Mô tả dự án">${p.description || ''}</textarea>
                    
                    <label class="form-label fw-bold small text-muted">Tải File Lên Từ Máy</label>
                    <input type="file" id="swal-edit-pfile" class="form-control mb-3">
                    
                    <label class="form-label fw-bold small text-muted">Hoặc Dán Link Tài Liệu</label>
                    <input id="swal-edit-plink" class="form-control mb-3" value="${p.documentLink || ''}" placeholder="Dán link vào đây">
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <label class="form-label fw-bold small text-muted">Bắt Đầu</label>
                            <input type="date" id="swal-edit-pstart" class="form-control" value="${p.startDate || ''}">
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-bold small text-muted">Hạn Chót</label>
                            <input type="date" id="swal-edit-pdeadline" class="form-control" value="${p.deadline || ''}">
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu thay đổi',
            cancelButtonText: 'Hủy',
            preConfirm: async () => {
                const name = document.getElementById('swal-edit-pname').value;
                const description = document.getElementById('swal-edit-pdesc').value;
                let documentLink = document.getElementById('swal-edit-plink').value;
                const startDate = document.getElementById('swal-edit-pstart').value;
                const deadline = document.getElementById('swal-edit-pdeadline').value;
                const fileInput = document.getElementById('swal-edit-pfile');

                if (!name) {
                    Swal.showValidationMessage('Tên dự án không được để trống!');
                    return false;
                }

                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append("file", fileInput.files[0]);
                    try {
                        Swal.getConfirmButton().disabled = true;
                        const uploadRes = await api.post('/files/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        // Đính URL upload trả về thành documentLink
                        documentLink = "http://localhost:8080" + uploadRes.data.url;
                    } catch (err) {
                        Swal.showValidationMessage('Lỗi upload file: ' + err.message);
                        return false;
                    }
                }

                return { name, description, documentLink, startDate, deadline };
            }
        });

        if (formValues) {
            try {
                await api.put(`/projects/${p.id}/update`, formValues);
                await Swal.fire('Thành công!', 'Đã cập nhật dự án.', 'success');
                fetchData();
                fetchLatestLogAndShowUndo();
            } catch (err) {
                Swal.fire('Lỗi', err.response?.data || err.message, 'error');
            }
        }
    };

    const handleOpenMemberModal = (project) => {
        setSelectedProjectForMember(project);
        const projectDeptId = project.deptId || (project.department ? project.department.id : null);

        let deptMembersList = users.filter(u =>
            u.department &&
            u.department.id == projectDeptId &&
            (u.role === 'EMPLOYEE' || u.role === 'MANAGER')
        );

        const existingMemberIds = (project.members || []).map(m => m.id);
        const available = deptMembersList.filter(u => !existingMemberIds.includes(u.id));

        setAvailableMembers(available);
        setSelectedMembersToAdd([]);
        setShowMemberModal(true);
    };

    const handleAddMemberToProject = async () => {
        if (selectedMembersToAdd.length === 0) {
            alert("Vui lòng chọn ít nhất một nhân viên!");
            return;
        }
        try {
            await api.post(`/projects/${selectedProjectForMember.id}/add-members`, selectedMembersToAdd);
            alert(`✅ Đã thêm ${selectedMembersToAdd.length} nhân sự thành công!`);
            setShowMemberModal(false);
            setSelectedMembersToAdd([]);
            fetchData();
        } catch (err) {
            console.error("❌ Lỗi thêm member:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Thất bại";
            alert("Lỗi: " + errorMessage);
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!selectedDept) return;
        try {
            const url = `/projects/create?deptId=${selectedDept.id}&email=${currentUser.email}`;
            await api.post(url, newProject);
            alert(`Đã tạo dự án cho phòng ${selectedDept.name}!`);
            fetchData();
            fetchLatestLogAndShowUndo();
            setNewProject({ name: '', description: '', deadline: '', priority: 'MEDIUM' });
            setShowProjectForm(false);
        } catch (error) { console.error(error); alert("Lỗi tạo dự án!"); }
    };

    const getProjectsByDept = (deptId) => { return projects.filter(p => (p.deptId == deptId || p.department?.id == deptId)); };
    const getCompletedProjectsByDept = (deptId) => { return completedProjects.filter(p => (p.deptId == deptId || p.department?.id == deptId)); };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
            {/* Header Navbar */}
            <div className="glass-header d-flex justify-content-between align-items-center shadow-sm w-100 sticky-top">
                {/* Logo - Fixed Width for Balance */}
                <div className="d-flex align-items-center" style={{ width: '260px' }}>
                    <span className="fs-3 me-2">🚀</span>
                    <span className="brand-text d-none d-md-block">ADMIN PRO</span>
                </div>

                {/* Centered Menu */}
                <div className="top-menu d-none d-xl-flex justify-content-center">
                    <button className={`top-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => navigate('/admin/users')}>
                        <i className="bi bi-people-fill top-menu-icon"></i> Nhân sự
                    </button>
                    <button className={`top-menu-item ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => navigate('/admin/departments')}>
                        <i className="bi bi-building-fill top-menu-icon"></i> Phòng Ban
                    </button>
                    <button className={`top-menu-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => navigate('/admin/projects')}>
                        <i className="bi bi-folder-fill top-menu-icon"></i> Dự Án
                    </button>
                    <button className={`top-menu-item ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => navigate('/admin/completed')}>
                        <i className="bi bi-check-circle-fill top-menu-icon"></i> Đã Hoàn Thành
                    </button>
                    <button className={`top-menu-item ${activeTab === 'statistics' ? 'active' : ''}`} onClick={() => navigate('/admin/statistics')}>
                        <i className="bi bi-bar-chart-fill top-menu-icon"></i> Thống kê
                    </button>
                    {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                        <button className={`top-menu-item ${activeTab === 'activity-logs' ? 'active' : ''}`} onClick={() => navigate('/admin/activity-logs')}>
                            <i className="bi bi-clock-history top-menu-icon"></i> Nhật ký
                        </button>
                    )}
                </div>

                {/* Right Profile Actions */}
                <div className="d-flex align-items-center justify-content-end gap-3" style={{ width: '260px' }}>
                    <div className="d-none d-md-block"><NotificationBell /></div>

                    <div className="dropdown position-relative ms-1">
                        <div
                            className="d-flex align-items-center py-1 px-2 rounded-pill shadow-sm"
                            style={{ cursor: 'pointer', background: showProfileMenu ? '#f4f7fe' : 'transparent', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm overflow-hidden" style={{ width: 36, height: 36 }}>
                                {currentUser?.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'
                                )}
                            </div>
                            <div className="ms-2 me-2 d-none d-sm-block text-start">
                                <div className="fw-bold text-dark" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{currentUser?.fullName}</div>
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {currentUser?.role === 'SUPER_ADMIN' ? 'Quản trị cấp cao' : 'Quản trị viên'}
                                </small>
                            </div>
                            <i className="bi bi-chevron-down ms-1 text-muted me-2" style={{ fontSize: '0.8rem' }}></i>
                        </div>

                        {showProfileMenu && (
                            <div className="dropdown-menu show shadow border-0 position-absolute end-0 mt-2 p-2 rounded-4" style={{ minWidth: '220px', backgroundColor: '#fff', top: '100%', zIndex: 1050 }}>
                                <div className="px-3 py-2 mb-1 d-sm-none border-bottom">
                                    <div className="fw-bold text-dark">{currentUser?.fullName}</div>
                                    <small className="text-muted">
                                        {currentUser?.role === 'SUPER_ADMIN' ? 'Quản trị cấp cao' : 'Quản trị viên'}
                                    </small>
                                </div>
                                <button className="dropdown-item rounded-3 py-2 fw-bold text-dark mb-1 d-flex align-items-center modern-dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>
                                    <i className="bi bi-person-fill me-2 fs-5 text-primary"></i> Tài khoản của tôi
                                </button>
                                <button className="dropdown-item rounded-3 py-2 fw-bold text-dark mb-1 d-flex align-items-center modern-dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/admin/trash'); }}>
                                    <i className="bi bi-trash-fill me-2 fs-5 text-danger"></i> Thùng rác
                                </button>
                                <div className="dropdown-divider my-1 border-light"></div>
                                <button className="dropdown-item rounded-3 py-2 fw-bold text-danger d-flex align-items-center modern-dropdown-item" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                                    <i className="bi bi-box-arrow-right me-2 fs-5"></i> Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="admin-main-wrapper">
                <div className="p-4 p-md-5 animate-fade-in content-inner">
                    <div className="d-flex justify-content-between align-items-center mb-4 d-xl-none bg-white p-3 rounded-4 shadow-sm">
                        <h4 className="page-title mb-0 fs-5">{activeTab === 'users' ? 'Quản lý Nhân sự' : activeTab === 'departments' ? 'Phòng Ban' : activeTab === 'projects' ? 'Quản lý Dự án' : activeTab === 'completed' ? 'Dự án Hoàn thành' : activeTab === 'statistics' ? 'Thống kê' : 'Thùng rác'}</h4>
                        <select className="form-select modern-input w-auto fw-bold text-primary-dark shadow-sm py-1" value={activeTab} onChange={(e) => navigate(`/admin/${e.target.value}`)}>
                            <option value="users">Nhân sự</option>
                            <option value="departments">Phòng ban</option>
                            <option value="projects">Dự án</option>
                            <option value="completed">Đã hoàn thành</option>
                            <option value="statistics">Thống kê</option>
                            <option value="trash">Thùng rác</option>
                        </select>
                    </div>
                    {activeTab === 'users' && (
                        <div className="row g-4">
                            <div className="col-12 col-xl-3">
                                <div className="bg-white rounded-4 shadow-sm h-100" style={{ border: '1px solid #f1f5f9' }}>
                                    <div className="px-4 pt-4 pb-2 fw-bold" style={{ color: '#1e293b', fontSize: '1.15rem' }}>Thêm Nhân Sự Mới</div>
                                    <div className="px-4 pb-4 mt-2">
                                        <form onSubmit={handleAddUser}>
                                            <div className="mb-4 text-center">
                                                <div className="position-relative d-inline-block">
                                                    {avatarPreview ? (
                                                        <img src={avatarPreview} alt="Avatar preview" className="rounded-circle shadow-sm" style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid #f1f5f9' }} />
                                                    ) : (
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto shadow-sm" style={{ width: 80, height: 80, backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                                            <i className="bi bi-person-plus" style={{ fontSize: '1.8rem', color: '#94a3b8' }}></i>
                                                        </div>
                                                    )}
                                                    <input type="file" id="avatarInput" accept="image/png,image/jpeg,image/jpg" onChange={handleAvatarSelect} style={{ display: 'none' }} />
                                                </div>
                                                <div className="d-flex justify-content-center mt-2">
                                                    <button type="button" className="btn btn-sm btn-light border p-1 px-2 rounded-pill shadow-sm" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6' }} onClick={handleEditAvatar}>
                                                        <i className="bi bi-camera-fill me-1"></i> Thay ảnh
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="form-groups-wrapper">
                                                <div className="mb-3">
                                                    <label className="d-flex align-items-center mb-1 fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                                                        <i className="bi bi-person me-2 text-primary opacity-75"></i> Họ tên
                                                    </label>
                                                    <input className="form-control form-control-sm shadow-none py-2" placeholder="Nhập họ tên..." required value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem' }} />
                                                </div>

                                                <div className="row g-2 mb-3">
                                                    <div className="col-12">
                                                        <label className="d-flex align-items-center mb-1 fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                                                            <i className="bi bi-envelope me-2 text-primary opacity-75"></i> Email nội bộ
                                                        </label>
                                                        <input className="form-control form-control-sm shadow-none py-2" placeholder="email@company.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem' }} />
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="d-flex align-items-center mb-1 fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                                                        <i className="bi bi-google me-2 text-danger opacity-75"></i> Google Email
                                                    </label>
                                                    <input className="form-control form-control-sm shadow-none py-2" placeholder="gmail@gmail.com" value={newUser.googleEmail || ''} onChange={e => setNewUser({ ...newUser, googleEmail: e.target.value })} style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem' }} />
                                                </div>

                                                <div className="mb-3">
                                                    <label className="d-flex align-items-center mb-1 fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                                                        <i className="bi bi-shield-lock me-2 text-warning opacity-75"></i> Mật khẩu
                                                    </label>
                                                    <input className="form-control form-control-sm shadow-none py-2" type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem' }} />
                                                </div>

                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <label className="d-flex align-items-center mb-1 fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                                                            <i className="bi bi-building me-2 text-info opacity-75"></i> Phòng ban
                                                        </label>
                                                        <select className="form-select form-select-sm shadow-none py-2" style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.8rem', color: newUser.deptId ? '#1e293b' : '#94a3b8' }} value={newUser.deptId} onChange={e => setNewUser({ ...newUser, deptId: e.target.value })}>
                                                            <option value="">-- Chọn --</option>
                                                            {departments.map(d => <option key={d.id} value={d.id}>{formatDeptName(d.name)}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-6">
                                                        <label className="d-flex align-items-center mb-1 fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                                                            <i className="bi bi-briefcase me-2 text-success opacity-75"></i> Chức vụ
                                                        </label>
                                                        <select className="form-select form-select-sm shadow-none py-2" style={{ borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.8rem' }} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                                            <option value="EMPLOYEE">Nhân viên</option>
                                                            <option value="MANAGER">Trưởng phòng</option>
                                                            <option value="ADMIN">Quản trị viên</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="btn w-100 fw-bold mt-4 shadow-sm" style={{ backgroundColor: '#5b52ff', color: 'white', borderRadius: '12px', padding: '12px 0', fontSize: '0.9rem' }}>
                                                <i className="bi bi-person-fill-add me-2"></i> XÁC NHẬN TẠO
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-xl-9">
                                <div className="bg-white rounded-4 shadow-sm d-flex flex-column h-100" style={{ border: '1px solid #f1f5f9' }}>
                                    <div className="px-4 py-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                            <div className="d-flex align-items-center">
                                                <span className="fw-bold" style={{ color: '#1e293b', fontSize: '1rem' }}>Danh sách Nhân viên</span>
                                                <span className="badge ms-2" style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 600, fontSize: '0.7rem', borderRadius: '6px' }}>{users.length}</span>
                                            </div>

                                            <div className="d-flex flex-wrap align-items-center gap-2">
                                                {/* Ô Tìm kiếm */}
                                                <div className="position-relative" style={{ width: '240px' }}>
                                                    <i className="bi bi-search position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}></i>
                                                    <input
                                                        className="form-control form-control-sm shadow-none ps-5"
                                                        placeholder="Tìm Tên, Email..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '10px', fontSize: '0.8rem' }}
                                                    />
                                                </div>

                                                {/* Filter Phòng ban */}
                                                <div style={{ width: '180px' }}>
                                                    <select
                                                        className="form-select form-select-sm shadow-none"
                                                        value={filterDeptId}
                                                        onChange={(e) => setFilterDeptId(e.target.value)}
                                                        style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '10px', fontSize: '0.8rem', color: filterDeptId ? '#1e293b' : '#94a3b8' }}
                                                    >
                                                        <option value="">Tất cả Phòng ban</option>
                                                        {departments.map(d => (
                                                            <option key={d.id} value={d.id}>{formatDeptName(d.name)}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Filter Chức vụ */}
                                                <div style={{ width: '160px' }}>
                                                    <select
                                                        className="form-select form-select-sm shadow-none"
                                                        value={filterRole}
                                                        onChange={(e) => setFilterRole(e.target.value)}
                                                        style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '10px', fontSize: '0.8rem', color: filterRole ? '#1e293b' : '#94a3b8' }}
                                                    >
                                                        <option value="">Tất cả Chức vụ</option>
                                                        <option value="ADMIN">Quản trị viên</option>
                                                        <option value="MANAGER">Trưởng phòng</option>
                                                        <option value="EMPLOYEE">Nhân viên</option>
                                                    </select>
                                                </div>

                                                {/* Nút Reset */}
                                                {(searchTerm || filterDeptId || filterRole) && (
                                                    <button
                                                        className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                                                        onClick={handleResetFilters}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#64748b' }}
                                                        title="Đặt lại bộ lọc"
                                                    >
                                                        <i className="bi bi-arrow-counterclockwise fs-6"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive flex-grow-1" style={{ padding: '0 10px' }}>
                                        <table className="table premium-table align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th className="text-center" style={{ width: '60px', paddingLeft: '15px', whiteSpace: 'nowrap' }}>Ảnh</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Nhân viên</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Liên hệ (Email)</th>
                                                    <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Phòng ban / Vị trí</th>
                                                    <th style={{ width: '130px', whiteSpace: 'nowrap' }}>Phân quyền</th>
                                                    <th className="text-center" style={{ width: '100px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                                                    <th className="text-end" style={{ width: '110px', paddingRight: '15px', whiteSpace: 'nowrap' }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map(u => {
                                                    const isEditing = editingUserId === u.id;
                                                    return (
                                                        <tr key={u.id} className="tr-premium">
                                                            <td className="text-center td-premium">
                                                                {u.avatarUrl ? (
                                                                    <img src={u.avatarUrl} alt={u.fullName} className="rounded-circle" style={{ width: 38, height: 38, objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto fw-bold" style={{ width: 38, height: 38, fontSize: '1rem', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                                                        {u.fullName ? u.fullName.charAt(0).toUpperCase() : '?'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="td-premium">
                                                                <div className="fw-bold" style={{ color: '#1e293b', fontSize: '0.9rem' }}>{u.fullName}</div>
                                                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                                    <i className="bi bi-calendar3 me-1"></i>
                                                                    Tham gia: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '--'}
                                                                </div>
                                                            </td>
                                                            <td className="td-premium">
                                                                {isEditing ? (
                                                                    <div className="d-flex flex-column gap-2" style={{ minWidth: '220px' }}>
                                                                        <div>
                                                                            <div className="edit-label-sm">
                                                                                <i className="bi bi-envelope"></i> Email Nội bộ
                                                                            </div>
                                                                            <input
                                                                                className="form-control shadow-none edit-input-premium"
                                                                                value={editEmail}
                                                                                onChange={(e) => setEditEmail(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <div className="edit-label-sm">
                                                                                <i className="bi bi-google text-danger"></i> Google Email
                                                                            </div>
                                                                            <input
                                                                                className="form-control shadow-none edit-input-premium"
                                                                                placeholder="Nhập Gmail..."
                                                                                value={editGoogleEmail}
                                                                                onChange={(e) => setEditGoogleEmail(e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="d-flex flex-column gap-1">
                                                                        <span style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                                                                            <i className="bi bi-envelope me-2 opacity-50"></i>{u.email}
                                                                        </span>
                                                                        {u.googleEmail && (
                                                                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                                                                                <i className="bi bi-google me-2 text-danger opacity-75"></i>{u.googleEmail}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="td-premium">
                                                                {isEditing ? (
                                                                    <div>
                                                                        <div className="edit-label-sm">Phòng ban</div>
                                                                        <select
                                                                            className="form-select shadow-none edit-input-premium"
                                                                            value={editDeptId}
                                                                            onChange={(e) => setEditDeptId(e.target.value)}
                                                                        >
                                                                            <option value="">-- Không có --</option>
                                                                            {departments.map(d => (
                                                                                <option key={d.id} value={d.id}>{formatDeptName(d.name)}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    u.department?.name ?
                                                                        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '6px', padding: '6px 10px', fontWeight: 600, fontSize: '0.72rem' }}>
                                                                            <i className="bi bi-building me-1 text-muted opacity-75"></i> {formatDeptName(u.department.name)}
                                                                        </span> :
                                                                        <span className="text-muted small italic opacity-50">Chưa xếp phòng</span>
                                                                )}
                                                            </td>
                                                            <td className="td-premium">
                                                                {isEditing ? (
                                                                    <div>
                                                                        <div className="edit-label-sm">Chức vụ</div>
                                                                        <select
                                                                            className="form-select shadow-none edit-input-premium"
                                                                            value={editRole}
                                                                            onChange={(e) => setEditRole(e.target.value)}
                                                                        >
                                                                            <option value="EMPLOYEE">Nhân viên</option>
                                                                            <option value="MANAGER">Trưởng phòng</option>
                                                                            <option value="ADMIN">Quản trị viên</option>
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <span className="badge rounded-pill" style={{
                                                                        backgroundColor: u.role === 'SUPER_ADMIN' ? '#f5f3ff' : u.role === 'ADMIN' ? '#eff6ff' : u.role === 'MANAGER' ? '#fffbeb' : '#f0fdf4',
                                                                        color: u.role === 'SUPER_ADMIN' ? '#7c3aed' : u.role === 'ADMIN' ? '#3b82f6' : u.role === 'MANAGER' ? '#d97706' : '#16a34a',
                                                                        border: `1px solid ${u.role === 'SUPER_ADMIN' ? '#ddd6fe' : u.role === 'ADMIN' ? '#dbeafe' : u.role === 'MANAGER' ? '#fef3c7' : '#dcfce7'}`,
                                                                        padding: '5px 12px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 800,
                                                                        boxShadow: u.role === 'SUPER_ADMIN' ? '0 2px 4px rgba(124, 58, 237, 0.1)' : 'none'
                                                                    }}>
                                                                        {u.role === 'SUPER_ADMIN' ? <i className="bi bi-shield-lock-fill me-1"></i> :
                                                                            u.role === 'ADMIN' ? <i className="bi bi-award-fill me-1"></i> :
                                                                                u.role === 'MANAGER' ? <i className="bi bi-briefcase-fill me-1"></i> :
                                                                                    <i className="bi bi-person-fill me-1"></i>}
                                                                        {u.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : u.role}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="td-premium text-center">
                                                                {u.active !== false ? (
                                                                    <span className="badge rounded-pill" style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '4px 12px', fontSize: '0.7rem', fontWeight: 600 }}>Online</span>
                                                                ) : (
                                                                    <span className="badge rounded-pill" style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '4px 12px', fontSize: '0.7rem', fontWeight: 600 }}>Locked</span>
                                                                )}
                                                            </td>
                                                            <td className="text-end td-premium" style={{ paddingRight: '20px' }}>
                                                                {u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN' && (
                                                                    isEditing ? (
                                                                        <div className="d-flex justify-content-end gap-2">
                                                                            <button className="btn-soft btn-soft-success shadow-sm px-3" title="Lưu nhanh" onClick={handleSaveEdit}>
                                                                                <i className="bi bi-check-circle-fill me-2"></i>Lưu
                                                                            </button>
                                                                            <button className="btn-soft btn-soft-secondary shadow-sm" title="Quay lại" onClick={handleCancelEdit}>
                                                                                <i className="bi bi-x-lg"></i>
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="d-flex justify-content-end gap-2">
                                                                            <button className="btn-soft btn-soft-primary shadow-sm" title="Chỉnh sửa" onClick={() => handleEditUser(u.id)}>
                                                                                <i className="bi bi-pencil-square fs-6"></i>
                                                                            </button>
                                                                            <button className="btn-soft btn-soft-danger shadow-sm" title="Xóa bỏ" onClick={() => handleDeleteUser(u.id)}>
                                                                                <i className="bi bi-trash3-fill fs-6"></i>
                                                                            </button>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {users.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" className="text-center py-5 text-muted">
                                                            <i className="bi bi-inbox fs-1 d-block mb-2"></i> Không tìm thấy nhân sự phù hợp.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    {users.length > 0 && (
                                        <div className="px-4 py-3 border-top d-flex justify-content-between align-items-center bg-white rounded-bottom-4">
                                            <div className="text-muted small">
                                                Đang xem từ <b>{Math.min((currentPage - 1) * usersPerPage + 1, users.length)}</b> đến <b>{Math.min(currentPage * usersPerPage, users.length)}</b> của <b>{users.length}</b> nhân viên
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className={`btn btn-sm ${currentPage === 1 ? 'btn-light disabled text-muted' : 'btn-soft btn-soft-primary'} px-3 rounded-pill`}
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    <i className="bi bi-chevron-left me-1"></i> Trước
                                                </button>

                                                {Array.from({ length: Math.ceil(users.length / usersPerPage) }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center ${currentPage === page ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                                                        style={{ width: '32px', height: '32px', fontSize: '0.8rem', fontWeight: 600 }}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                                <button
                                                    className={`btn btn-sm ${currentPage === Math.ceil(users.length / usersPerPage) ? 'btn-light disabled text-muted' : 'btn-soft btn-soft-primary'} px-3 rounded-pill`}
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={currentPage === Math.ceil(users.length / usersPerPage)}
                                                >
                                                    Sau <i className="bi bi-chevron-right ms-1"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'departments' && (
                        <div className="row g-4">
                            <div className="col-12 col-md-4">
                                <div className="modern-card mb-4 h-100">
                                    <div className="modern-card-header">Tạo Phòng Ban Mới</div>
                                    <div className="card-body p-4 bg-white">
                                        <form onSubmit={handleAddDept}>
                                            <input className="form-control modern-input mb-3" placeholder="Tên phòng ban" required value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} />
                                            <textarea className="form-control modern-input mb-4" placeholder="Mô tả" rows="4" value={newDept.description} onChange={e => setNewDept({ ...newDept, description: e.target.value })}></textarea>
                                            <button className="modern-btn-primary w-100">➕ Thêm Phòng Ban</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-8">
                                <div className="modern-card h-100">
                                    <div className="modern-card-header">Danh sách Phòng Ban</div>
                                    <div className="card-body p-4 bg-light overflow-auto">
                                        <div className="row g-3">
                                            {departments.map(d => (
                                                <div key={d.id} className="col-md-6 text-dark">
                                                    <div className="modern-card p-4 h-100 border border-1 border-opacity-10 shadow-sm d-flex flex-column">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="fw-bold mb-0 text-primary-dark"><i className="bi bi-building me-2 text-primary"></i>{formatDeptName(d.name)}</h6>
                                                            <div className="d-flex gap-1" style={{ marginTop: '-4px' }}>
                                                                <button className="btn btn-sm text-success hover-text-success p-1 border-0 me-1" title="Thêm nhân viên vào phòng" onClick={(e) => { e.stopPropagation(); handleOpenDeptMemberModal(d); }}><i className="bi bi-person-plus-fill fs-6"></i></button>
                                                                <button className="btn btn-sm text-primary hover-text-primary p-1 border-0" title="Sửa thông tin phòng" onClick={(e) => { e.stopPropagation(); handleEditDepartment(d); }}><i className="bi bi-pencil-square fs-6"></i></button>
                                                                <button className="btn btn-sm text-danger text-opacity-75 hover-text-danger p-1 border-0" title="Xóa phòng ban" onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(d.id); }}><i className="bi bi-trash-fill fs-6"></i></button>
                                                            </div>
                                                        </div>
                                                        <p className="text-muted small mb-3 flex-grow-1">{d.description || 'Chưa có mô tả'}</p>
                                                        <div className="mt-auto pt-3 border-top border-1 border-primary border-opacity-10">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <div className="text-muted small fw-bold">
                                                                    <i className="bi bi-people-fill text-primary text-opacity-75 me-1"></i>
                                                                    {users.filter(u => u.department?.id === d.id).length} nhân sự
                                                                </div>
                                                                <button
                                                                    className="btn btn-sm btn-light border rounded-pill px-3 fw-bold text-primary shadow-sm"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedDeptForPersonnel(d);
                                                                        setShowDeptPersonnelModal(true);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-eye-fill me-1"></i> Xem danh sách
                                                                </button>
                                                            </div>
                                                            <div className="d-flex align-items-center bg-light p-2 rounded border">
                                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                                                                    <i className="bi bi-person-badge-fill"></i>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="small fw-bold text-dark text-truncate" style={{ fontSize: '0.8rem' }}>Trưởng phòng</div>
                                                                    <div className="small text-muted text-truncate" style={{ fontSize: '0.85rem' }}>
                                                                        {d.manager ? d.manager.fullName : <span className="fst-italic">Chưa có trưởng phòng</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {departments.length === 0 && <div className="col-12 text-center text-muted py-4">Chưa có phòng ban nào.</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="row g-4">
                            <div className="col-12 col-xl-3">
                                <div className="modern-card h-100" style={{ minHeight: '600px' }}>
                                    <div className="modern-card-header bg-white text-dark border-bottom">Chọn Phòng Ban</div>
                                    <div className="list-group shadow-none border-0 overflow-hidden rounded-0">
                                        <button
                                            className={`list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center ${!selectedDept ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}
                                            onClick={() => { setSelectedDept(null); setShowProjectForm(false); }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-globe-americas me-2 text-primary fs-5"></i>
                                                <span className="fw-bold text-dark">Tất cả dự án</span>
                                            </div>
                                            {!selectedDept ? <i className="bi bi-chevron-right text-primary fw-bold"></i> : <i className="bi bi-chevron-right text-muted"></i>}
                                        </button>

                                        {departments.map(d => (
                                            <button key={d.id} className={`list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center ${selectedDept?.id === d.id ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`} onClick={() => { setSelectedDept(d); setShowProjectForm(false); }}>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-building me-2 text-primary opacity-75 fs-5"></i>
                                                    <div className="fw-bold text-dark">{formatDeptName(d.name)}</div>
                                                </div>
                                                {selectedDept?.id === d.id ? <i className="bi bi-chevron-right text-primary fw-bold"></i> : <i className="bi bi-chevron-right text-muted"></i>}
                                            </button>
                                        ))}
                                        {departments.length === 0 && <div className="text-center text-muted p-4 small">Hãy tạo phòng ban trước.</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-xl-9">
                                <div className="modern-card d-flex flex-column h-100" style={{ minHeight: '600px' }}>
                                    {(() => {
                                        const projectsToDisplay = selectedDept ? getProjectsByDept(selectedDept.id) : projects.filter(p => !p.isDeleted);
                                        return (
                                            <>
                                                <div className="modern-card-header d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-bold text-dark">
                                                            {selectedDept ? `📂 Dự án: ${formatDeptName(selectedDept.name)}` : `🌍 Tất cả dự án (${projectsToDisplay.length})`}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="btn-group btn-group-sm bg-white shadow-sm rounded" style={{ border: '1px solid #e2e8f0' }}>
                                                            <button className={`btn ${projectViewMode === 'grid' ? 'btn-primary text-white' : 'btn-light text-muted'}`} onClick={() => setProjectViewMode('grid')} title="Dạng thẻ (Grid)"><i className="bi bi-grid-fill"></i></button>
                                                            <button className={`btn ${projectViewMode === 'table' ? 'btn-primary text-white' : 'btn-light text-muted'}`} onClick={() => setProjectViewMode('table')} title="Dạng bảng (Table)"><i className="bi bi-list-ul"></i></button>
                                                        </div>
                                                        {selectedDept && (
                                                            <button className="btn btn-sm btn-success fw-bold shadow-sm rounded-pill px-3" onClick={() => setShowProjectForm(!showProjectForm)}>{showProjectForm ? 'Hủy' : '➕ Thêm Dự Án'}</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="card-body p-4 bg-light">
                                                    {selectedDept && showProjectForm && (
                                                        <div className="modern-card mb-4 border border-primary border-opacity-25 shadow-sm">
                                                            <div className="modern-card-header bg-primary bg-opacity-10 text-primary-dark d-flex align-items-center">
                                                                <i className="bi bi-file-earmark-plus-fill me-2 text-primary"></i>
                                                                <span>Khởi tạo Dự án mới</span>
                                                            </div>
                                                            <div className="card-body p-4 bg-white">
                                                                <form onSubmit={handleAddProject}>
                                                                    <div className="mb-4">
                                                                        <label className="form-label fw-bold text-dark mb-2">Tên dự án <span className="text-danger">*</span></label>
                                                                        <input className="form-control modern-input w-100" placeholder="VD: Nâng cấp hệ thống Backend..." required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                                                                    </div>
                                                                    <div className="row mb-4">
                                                                        <div className="col-12 col-md-4 mb-3 mb-md-0">
                                                                            <label className="form-label fw-bold text-dark mb-2">Bắt đầu <span className="text-danger">*</span></label>
                                                                            <input type="date" className="form-control modern-input w-100" required value={newProject.startDate} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} />
                                                                        </div>
                                                                        <div className="col-12 col-md-4 mb-3 mb-md-0">
                                                                            <label className="form-label fw-bold text-dark mb-2">Hạn chót <span className="text-danger">*</span></label>
                                                                            <input type="date" className="form-control modern-input w-100" required value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} />
                                                                        </div>
                                                                        <div className="col-12 col-md-4">
                                                                            <label className="form-label fw-bold text-dark mb-2">Mức độ ưu tiên <span className="text-danger">*</span></label>
                                                                            <select className="form-select modern-input w-100" value={newProject.priority} onChange={e => setNewProject({ ...newProject, priority: e.target.value })}>
                                                                                <option value="LOW">🔵 Ưu tiên Thấp</option>
                                                                                <option value="MEDIUM">🟡 Ưu tiên Trung bình</option>
                                                                                <option value="HIGH">🔴 Ưu tiên Cao</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-4">
                                                                        <label className="form-label fw-bold text-dark mb-2">Mô tả/Mục tiêu dự án</label>
                                                                        <textarea className="form-control modern-input w-100" rows="3" placeholder="Nhập chi tiết về mục tiêu, yêu cầu..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                                                                    </div>
                                                                    <button className="modern-btn-primary w-100 py-2 d-flex justify-content-center align-items-center">
                                                                        <i className="bi bi-cloud-arrow-up-fill me-2 mb-0 fs-5"></i>
                                                                        <span className="fw-bold">Khởi tạo và Lưu Dự Án</span>
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {projectsToDisplay.length === 0 && !showProjectForm && <div className="text-center text-muted py-5">Không có dự án nào đang thực hiện.</div>}
                                                    {projectsToDisplay.length > 0 && (
                                                        projectViewMode === 'grid' ? (
                                                            <div className="row g-3">
                                                                {projectsToDisplay.map(p => (
                                                                    <div key={p.id} className="col-12 col-md-6 col-xxl-4">
                                                                        <div className="modern-card p-4 h-100 d-flex flex-column shadow-sm border-0 border-start border-4 border-primary transition-hover text-dark position-relative">
                                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                                <div>
                                                                                    <h5 className="fw-bold text-primary-dark mb-1">{p.name}</h5>
                                                                                    <span className={`badge ${p.priority === 'HIGH' ? 'bg-danger text-white' : p.priority === 'LOW' ? 'bg-info text-dark' : 'bg-warning text-dark'} rounded-pill px-3 py-1 shadow-sm mb-2 me-2`}>
                                                                                        <i className="bi bi-flag-fill me-1"></i>{p.priority}
                                                                                    </span>
                                                                                    <span className={`badge ${getProjectTimeStatus(p).color} rounded-pill px-3 py-1 shadow-sm mb-2`}>
                                                                                        {getProjectTimeStatus(p).text}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <button
                                                                                        className="btn btn-sm text-primary text-opacity-75 hover-text-primary border-0 p-0 fs-5 lh-1 me-2"
                                                                                        title="Sửa dự án"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleEditProject(p);
                                                                                        }}
                                                                                    >
                                                                                        <i className="bi bi-pencil-square"></i>
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-sm text-danger text-opacity-50 hover-text-danger border-0 p-0 fs-5 lh-1"
                                                                                        title="Xóa dự án"
                                                                                        onClick={async (e) => {
                                                                                            e.stopPropagation();
                                                                                            if (await askConfirm('Xóa dự án này (Soft Delete)?')) {
                                                                                                api.delete(`/projects/${p.id}?adminEmail=${currentUser.email}`).then(() => {
                                                                                                    fetchData();
                                                                                                    alert('Dự án đã được xóa!');
                                                                                                }).catch(err => alert('Lỗi xóa: ' + err.message));
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <i className="bi bi-trash-fill"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            <div className="bg-light p-3 rounded-3 mb-3 border border-1 flex-grow-1">
                                                                                <div className="d-flex justify-content-between mb-1">
                                                                                    <span className="text-muted small fw-bold"><i className="bi bi-info-circle me-1"></i>Mô tả:</span>
                                                                                    {p.documentLink && (
                                                                                        <a href={p.documentLink.startsWith('http') ? p.documentLink : `https://${p.documentLink}`} target="_blank" rel="noopener noreferrer" className="badge bg-primary text-decoration-none" title="Tài liệu đính kèm" onClick={e => e.stopPropagation()}>
                                                                                            <i className="bi bi-link-45deg"></i> Link
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                                <p className="mb-0 text-dark" style={{ fontSize: '0.85rem' }}>{p.description || 'Chưa có thông tin...'}</p>
                                                                            </div>

                                                                            <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
                                                                                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                                                    <i className="bi bi-calendar-check text-success me-1"></i>
                                                                                    <span className="fw-bold text-dark text-nowrap">
                                                                                        {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '--'}
                                                                                        {' > '}
                                                                                        {p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : '--'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-muted small" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleOpenMemberModal(p); }} title="Thêm/Xem Nhân Viên">
                                                                                    <i className="bi bi-people-fill text-primary me-1"></i> <span className="fw-bold text-dark">{p.members?.length || 0}</span>
                                                                                    <i className="bi bi-person-plus-fill ms-1 text-success"></i>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="table-responsive bg-white rounded-4 shadow-sm border-0">
                                                                <table className="table premium-table align-middle mb-0">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Tên Dự Án</th>
                                                                            <th>Ưu tiên</th>
                                                                            <th>Tiến độ & Trạng thái</th>
                                                                            <th>Thành viên</th>
                                                                            <th className="text-end">Hành động</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {projectsToDisplay.map(p => (
                                                                            <tr key={p.id} className="tr-premium">
                                                                                <td className="td-premium">
                                                                                    <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{p.name}</div>
                                                                                    <div className="text-muted small text-truncate" style={{ maxWidth: '250px', fontSize: '0.75rem' }} title={p.description}>
                                                                                        <i className="bi bi-info-circle me-1"></i> {p.description || 'Không có mô tả'}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="td-premium">
                                                                                    <span className="badge rounded-pill" style={{
                                                                                        backgroundColor: p.priority === 'HIGH' ? '#fef2f2' : p.priority === 'MEDIUM' ? '#fffbeb' : '#f0f9ff',
                                                                                        color: p.priority === 'HIGH' ? '#ef4444' : p.priority === 'MEDIUM' ? '#f59e0b' : '#0ea5e9',
                                                                                        padding: '4px 12px',
                                                                                        fontSize: '0.7rem',
                                                                                        fontWeight: 700,
                                                                                        border: `1px solid ${p.priority === 'HIGH' ? '#fecaca' : p.priority === 'MEDIUM' ? '#fde68a' : '#bae6fd'}`
                                                                                    }}>
                                                                                        <i className="bi bi-flag-fill me-1"></i>{p.priority}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="td-premium">
                                                                                    <div className="small text-nowrap mb-1" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                                                        <span className="fw-medium">{p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '--'}</span>
                                                                                        <i className="bi bi-arrow-right mx-2 opacity-50"></i>
                                                                                        <span className="fw-bold" style={{ color: '#1e293b' }}>{p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : '---'}</span>
                                                                                    </div>
                                                                                    <span className={`badge rounded-pill px-2 py-1`} style={{
                                                                                        backgroundColor: getProjectTimeStatus(p).color.includes('bg-success') ? '#ecfdf5' : getProjectTimeStatus(p).color.includes('bg-danger') ? '#fef2f2' : '#eff6ff',
                                                                                        color: getProjectTimeStatus(p).color.includes('bg-success') ? '#10b981' : getProjectTimeStatus(p).color.includes('bg-danger') ? '#ef4444' : '#3b82f6',
                                                                                        fontSize: '0.65rem',
                                                                                        fontWeight: 600
                                                                                    }}>
                                                                                        {getProjectTimeStatus(p).text}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="td-premium">
                                                                                    <div className="d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleOpenMemberModal(p); }}>
                                                                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{ width: 32, height: 32, fontSize: '0.8rem', color: '#64748b', marginRight: '-8px', zIndex: 1 }}>
                                                                                            <i className="bi bi-people-fill"></i>
                                                                                        </div>
                                                                                        <div className="bg-white rounded-pill border px-2 py-1 shadow-sm small fw-bold" style={{ fontSize: '0.75rem', paddingLeft: '12px !important', color: '#1e293b' }}>
                                                                                            {p.members?.length || 0}
                                                                                            <i className="bi bi-plus-lg ms-1 text-primary"></i>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="text-end td-premium">
                                                                                    <div className="d-flex justify-content-end gap-2">
                                                                                        {p.documentLink && (
                                                                                            <a href={p.documentLink.startsWith('http') ? p.documentLink : `https://${p.documentLink}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ color: '#64748b', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '6px' }} title="Tài liệu 🔗" onClick={e => e.stopPropagation()}>
                                                                                                <i className="bi bi-link-45deg fs-6"></i>
                                                                                            </a>
                                                                                        )}
                                                                                        <button className="btn btn-sm text-white" style={{ backgroundColor: '#3b82f6', borderRadius: '6px', padding: '4px 10px' }} title="Sửa" onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleEditProject(p);
                                                                                        }}><i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i></button>
                                                                                        <button className="btn btn-sm" style={{ color: '#64748b', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '6px', padding: '4px 10px' }} title="Xóa" onClick={async (e) => {
                                                                                            e.stopPropagation();
                                                                                            if (await askConfirm('Xóa dự án này?')) {
                                                                                                api.delete(`/projects/${p.id}?adminEmail=${currentUser.email}`).then(() => {
                                                                                                    fetchData();
                                                                                                    fetchLatestLogAndShowUndo();
                                                                                                }).catch(err => alert('Lỗi: ' + err.message));
                                                                                            }
                                                                                        }}><i className="bi bi-trash-fill" style={{ fontSize: '0.75rem' }}></i></button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'statistics' && (
                        <AdminStatistics
                            users={users}
                            departments={departments}
                            projects={projects}
                            completedProjects={completedProjects}
                        />
                    )}

                    {activeTab === 'completed' && (
                        <div className="row">
                            <div className="col-12">
                                <h4 className="fw-bold text-success mb-4"><i className="bi bi-check-all me-2"></i>Dự án đã hoàn thành (CLOSED)</h4>
                                {departments.map(dept => {
                                    const deptCompletedProjects = getCompletedProjectsByDept(dept.id);
                                    if (deptCompletedProjects.length === 0) return null;
                                    return (
                                        <div key={dept.id} className="modern-card mb-4">
                                            <div className="modern-card-header bg-success text-white fw-bold d-flex align-items-center"><i className="bi bi-building me-2"></i>{dept.name}</div>
                                            <div className="card-body bg-light p-4">
                                                <div className="row g-4">
                                                    {deptCompletedProjects.map(p => (
                                                        <div key={p.id} className="col-md-6 col-lg-3">
                                                            <div className="modern-card h-100 hover-shadow border-0" style={{ cursor: 'pointer' }} onClick={() => setViewingCompletedProject(p)}>
                                                                <div className="card-body p-4">
                                                                    <div className="d-flex justify-content-between mb-3"><span className="badge bg-secondary rounded-pill px-3 py-2">🔒 CLOSED</span><small className="text-muted fw-bold">{p.deadline}</small></div>
                                                                    <h6 className="fw-bold text-primary-dark mb-2">{p.name}</h6>
                                                                    <p className="text-muted small text-truncate mb-4">{p.description}</p>
                                                                    <div className="d-flex justify-content-between border-top pt-3"><small className="text-muted fw-bold">{p.members?.length || 0} thành viên</small><span className="text-success small fw-bold">Chi tiết &rarr;</span></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {completedProjects.length === 0 && <div className="text-center py-5 text-muted">Chưa có dự án nào hoàn thành.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'trash' && (
                        <div className="row">
                            <div className="col-12">
                                <h4 className="fw-bold text-warning mb-4"><i className="bi bi-trash me-2"></i>Dự án đã xóa (Thùng rác)</h4>
                                {departments.map(dept => {
                                    const deptDeletedProjects = deletedProjects.filter(p => p.department?.id === dept.id);
                                    if (deptDeletedProjects.length === 0) return null;
                                    return (
                                        <div key={dept.id} className="modern-card mb-4">
                                            <div className="modern-card-header bg-warning text-dark fw-bold d-flex align-items-center"><i className="bi bi-building me-2"></i>{dept.name}</div>
                                            <div className="card-body bg-light p-4">
                                                <div className="row g-4">
                                                    {deptDeletedProjects.map(p => (
                                                        <div key={p.id} className="col-md-6 col-lg-3">
                                                            <div className="modern-card h-100">
                                                                <div className="card-body p-4">
                                                                    <div className="d-flex justify-content-between mb-3">
                                                                        <span className="badge bg-danger rounded-pill px-3 py-2">🗑️ ĐÃ XÓA</span>
                                                                        <small className="text-muted fw-bold">{p.deletedAt}</small>
                                                                    </div>
                                                                    <h6 className="fw-bold text-primary-dark mb-2">{p.name}</h6>
                                                                    <p className="text-muted small mb-4">{p.description}</p>
                                                                    <button
                                                                        className="modern-btn-primary bg-success w-100 mt-2"
                                                                        style={{ background: 'linear-gradient(135deg, #20c997 0%, #198754 100%)' }}
                                                                        onClick={async () => {
                                                                            if (await askConfirm('Khôi phục dự án này?', false)) {
                                                                                try {
                                                                                    await api.post(`/projects/${p.id}/restore`, null, {
                                                                                        params: { adminEmail: currentUser.email }
                                                                                    });
                                                                                    fetchData();
                                                                                    fetchLatestLogAndShowUndo();
                                                                                } catch (err) {
                                                                                    alert('Lỗi: ' + err.message);
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        🔄 Khôi phục
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {deletedProjects.length === 0 && <div className="text-center py-5 text-muted">Chưa có dự án nào trong thùng rác.</div>}
                            </div>
                        </div>
                    )}


                    {showDeptMemberModal && selectedDeptForMember && (
                        <div className="modal-backdrop-custom">
                            <div className="card shadow-lg border-0" style={{ width: 500, borderRadius: '1rem', overflow: 'hidden' }}>
                                <div className="card-header bg-success p-4 border-0 text-white d-flex flex-column position-relative">
                                    <button className="btn-close btn-close-white position-absolute top-0 end-0 m-3" onClick={() => setShowDeptMemberModal(false)}></button>
                                    <h5 className="fw-bold mb-1">Thêm nhân sự mới</h5>
                                    <span className="text-white text-opacity-75 small">Vào phòng: {formatDeptName(selectedDeptForMember.name)}</span>
                                </div>
                                <div className="card-body p-0">
                                    {availableDeptMembers.length > 0 ? (
                                        <div className="d-flex flex-column h-100">
                                            <div className="list-group list-group-flush custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                {availableDeptMembers.map(u => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action p-3 border-0 border-bottom d-flex align-items-center ${selectedDeptMembersToAdd.includes(u.id) ? 'bg-success bg-opacity-10' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (selectedDeptMembersToAdd.includes(u.id)) {
                                                                setSelectedDeptMembersToAdd(selectedDeptMembersToAdd.filter(id => id !== u.id));
                                                            } else {
                                                                setSelectedDeptMembersToAdd([...selectedDeptMembersToAdd, u.id]);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex-shrink-0 me-3">
                                                            {u.avatarUrl ? (
                                                                <img src={u.avatarUrl} alt={u.fullName} className="rounded-circle shadow-sm border border-2 border-white" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2 border-white" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                                                                    {u.fullName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="fw-bold text-dark text-truncate mb-1">{u.fullName}</div>
                                                            <div className="text-muted small text-truncate d-flex align-items-center mb-1">
                                                                <i className="bi bi-envelope me-1"></i> {u.email}
                                                            </div>
                                                            {u.department ?
                                                                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-normal" style={{ fontSize: '0.7rem' }}>
                                                                    <i className="bi bi-building me-1"></i>Đang ở: {formatDeptName(u.department.name)}
                                                                </span> :
                                                                <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '0.7rem' }}>
                                                                    <i className="bi bi-question-circle me-1"></i>Chưa có phòng
                                                                </span>
                                                            }
                                                        </div>
                                                        {selectedDeptMembersToAdd.includes(u.id) && (
                                                            <div className="ms-3 text-success ps-3 border-start border-success border-2">
                                                                <i className="bi bi-check-circle-fill fs-3"></i>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="p-3 border-top bg-light mt-auto">
                                                <button className="btn btn-success w-100 py-2 fs-6 fw-bold shadow-sm rounded-pill" onClick={handleAddMemberToDept} disabled={selectedDeptMembersToAdd.length === 0}>
                                                    <i className="bi bi-person-plus-fill me-2"></i> Xác nhận chuyển phòng
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-people-fill fs-1 d-block mb-3 opacity-25 text-success"></i>
                                            Tất cả nhân viên hệ thống đều đã tham gia phòng ban này.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {showMemberModal && selectedProjectForMember && (
                        <div className="modal-backdrop-custom">
                            <div className="card shadow-lg border-0" style={{ width: 500, borderRadius: '1rem', overflow: 'hidden' }}>
                                <div className="card-header bg-primary p-4 border-0 text-white d-flex flex-column position-relative">
                                    <button className="btn-close btn-close-white position-absolute top-0 end-0 m-3" onClick={() => setShowMemberModal(false)}></button>
                                    <h5 className="fw-bold mb-1">Thêm nhân sự mới</h5>
                                    <span className="text-white text-opacity-75 small">Vào dự án: {selectedProjectForMember.name}</span>
                                </div>
                                <div className="card-body p-0">
                                    {availableMembers.length > 0 ? (
                                        <div className="d-flex flex-column h-100">
                                            <div className="list-group list-group-flush custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                {availableMembers.map(u => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        className={`list-group-item list-group-item-action p-3 border-0 border-bottom d-flex align-items-center ${selectedMembersToAdd.includes(u.id) ? 'bg-primary bg-opacity-10' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (selectedMembersToAdd.includes(u.id)) {
                                                                setSelectedMembersToAdd(selectedMembersToAdd.filter(id => id !== u.id));
                                                            } else {
                                                                setSelectedMembersToAdd([...selectedMembersToAdd, u.id]);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex-shrink-0 me-3">
                                                            {u.avatarUrl ? (
                                                                <img src={u.avatarUrl} alt={u.fullName} className="rounded-circle shadow-sm border border-2 border-white" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2 border-white" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                                                                    {u.fullName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="fw-bold text-dark text-truncate mb-1">{u.fullName}</div>
                                                            <div className="text-muted small text-truncate d-flex align-items-center mb-1">
                                                                <i className="bi bi-envelope me-1"></i> {u.email}
                                                            </div>
                                                            {u.department ?
                                                                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-normal" style={{ fontSize: '0.7rem' }}>
                                                                    <i className="bi bi-building me-1"></i>Phòng: {formatDeptName(u.department.name)}
                                                                </span> :
                                                                <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: '0.7rem' }}>
                                                                    <i className="bi bi-question-circle me-1"></i>Chưa có phòng
                                                                </span>
                                                            }
                                                        </div>
                                                        {selectedMembersToAdd.includes(u.id) && (
                                                            <div className="ms-3 text-primary ps-3 border-start border-primary border-2">
                                                                <i className="bi bi-check-circle-fill fs-3"></i>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="p-3 border-top bg-light mt-auto">
                                                <button className="btn btn-primary w-100 py-2 fs-6 fw-bold shadow-sm rounded-pill" onClick={handleAddMemberToProject} disabled={selectedMembersToAdd.length === 0}>
                                                    <i className="bi bi-person-plus-fill me-2"></i> Xác nhận & Thêm vào
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-people-fill fs-1 d-block mb-3 opacity-25 text-primary"></i>
                                            Tất cả nhân viên hệ thống đều đã tham gia dự án này.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {viewingCompletedProject && (
                        <div className="modal-backdrop-custom">
                            <div className="modern-card shadow-lg" style={{ width: 600, maxHeight: '80vh', overflowY: 'auto' }}>
                                <div className="modern-card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center"><span>Chi tiết dự án: {viewingCompletedProject.name}</span><button className="btn-close btn-close-white" onClick={() => setViewingCompletedProject(null)}></button></div>
                                <div className="card-body p-5">
                                    <p className="text-muted fst-italic fs-5">{viewingCompletedProject.description}</p><hr className="my-4" />
                                    <h6 className="fw-bold text-success mb-3"><i className="bi bi-people-fill me-2"></i>Thành viên tham gia</h6>
                                    <div className="d-flex flex-wrap gap-2 mb-4">{viewingCompletedProject.members?.map(m => (<span key={m.id} className="badge bg-light text-dark border p-2 px-3 rounded-pill shadow-sm">{m.fullName}</span>))}</div>
                                    <h6 className="fw-bold text-success mb-3"><i className="bi bi-list-check me-2"></i>Tổng kết</h6>
                                    <div className="alert alert-success fs-6 border-0 shadow-sm rounded-4">Dự án này đã được Quản trị viên đóng lại.<br /><strong className="mt-2 d-block">Ngày hết hạn:</strong> {viewingCompletedProject.deadline}</div>
                                    <button className="btn btn-secondary w-100 rounded-pill fw-bold py-2 mt-3" onClick={() => setViewingCompletedProject(null)}>Đóng</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showDeptPersonnelModal && selectedDeptForPersonnel && (
                        <div className="modal-backdrop-custom">
                            <div className="modern-card shadow-lg animate-fade-in" style={{ width: '100%', maxWidth: '550px', borderRadius: '1.25rem', overflow: 'hidden' }}>
                                <div className="bg-primary p-4 text-white position-relative">
                                    <h5 className="fw-bold mb-1 text-white">Thành viên phòng ban</h5>
                                    <p className="small mb-0 text-white-50">{formatDeptName(selectedDeptForPersonnel.name)}</p>
                                    <button className="btn-close btn-close-white position-absolute top-0 end-0 m-4" onClick={() => setShowDeptPersonnelModal(false)}></button>
                                </div>
                                <div className="p-0">
                                    <div className="list-group list-group-flush custom-scrollbar" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                        {users.filter(u => u.department?.id === selectedDeptForPersonnel.id).length > 0 ? (
                                            users.filter(u => u.department?.id === selectedDeptForPersonnel.id).map(user => (
                                                <div key={user.id} className="list-group-item p-3 border-0 border-bottom d-flex align-items-center justify-content-between hover-bg-light transition">
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0 me-3">
                                                            {user.avatarUrl ? (
                                                                <img src={user.avatarUrl} alt={user.fullName} className="rounded-circle shadow-sm border border-2 border-white" style={{ width: 45, height: 45, objectFit: 'cover' }} />
                                                            ) : (
                                                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: 45, height: 45, fontSize: '1.1rem' }}>
                                                                    {user.fullName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.95rem' }}>{user.fullName}</div>
                                                            <div className="text-muted small text-truncate"><i className="bi bi-envelope me-1"></i> {user.email}</div>
                                                            <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'MANAGER' ? 'bg-warning text-dark' : 'bg-info text-white'} rounded-pill mt-1`} style={{ fontSize: '0.65rem' }}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                                                            style={{ fontSize: '0.75rem' }}
                                                            onClick={() => {
                                                                setShowDeptPersonnelModal(false);
                                                                setActiveTab('users');
                                                                handleEditUser(user.id);
                                                            }}
                                                        >
                                                            Chỉnh sửa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-5 text-muted">
                                                <i className="bi bi-people fs-1 d-block mb-2 opacity-25"></i>
                                                Chưa có nhân viên nào trong phòng này.
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-light border-top">
                                        <button className="btn btn-secondary w-100 rounded-pill fw-bold" onClick={() => setShowDeptPersonnelModal(false)}>Đóng</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <style>{`.bg-blue-light { background-color: #e7f1ff; } .modal-backdrop-custom { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1050; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); } .hover-bg-light:hover { background-color: #f8f9fa; } .transition { transition: all 0.2s ease; }`}</style>
                    {activeTab === 'activity-logs' && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                        <div className="animate-fade-in shadow-sm rounded-4 bg-white p-4" style={{ border: '1px solid #eef2f6', minHeight: '80vh' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history me-2 text-primary"></i>Nhật Ký Hoạt Động Hệ Thống</h4>
                                <div className="d-flex gap-2">
                                    <select className="form-select form-select-sm shadow-none" style={{ width: '160px', borderRadius: '10px' }} value={activityFilters.actionType} onChange={e => setActivityFilters({ ...activityFilters, actionType: e.target.value })}>
                                        <option value="">Tất cả hành động</option>
                                        <option value="LOGIN">Đăng nhập</option>
                                        <option value="CREATE">Thêm mới</option>
                                        <option value="UPDATE">Cập nhật</option>
                                        <option value="DELETE">Xóa</option>
                                        <option value="RESTORE">Khôi phục</option>
                                    </select>
                                    <input type="date" className="form-control form-control-sm shadow-none" style={{ width: '140px', borderRadius: '10px' }} value={activityFilters.startDate} onChange={e => setActivityFilters({ ...activityFilters, startDate: e.target.value })} />
                                    <input type="date" className="form-control form-control-sm shadow-none" style={{ width: '140px', borderRadius: '10px' }} value={activityFilters.endDate} onChange={e => setActivityFilters({ ...activityFilters, endDate: e.target.value })} />
                                    <button className="btn btn-sm btn-light border" onClick={() => setActivityFilters({ adminId: '', actionType: '', startDate: '', endDate: '' })} title="Đặt lại"><i className="bi bi-arrow-counterclockwise"></i></button>
                                </div>
                            </div>

                            <div className="table-responsive border-0">
                                <table className="table premium-log-table align-middle">
                                    <thead>
                                        <tr>
                                            <th className="border-0 bg-transparent text-muted small fw-bold py-3" style={{ width: '15%', letterSpacing: '1px' }}>THỜI GIAN</th>
                                            <th className="border-0 bg-transparent text-muted small fw-bold py-3" style={{ width: '22%', letterSpacing: '1px' }}>NGƯỜI THỰC HIỆN</th>
                                            <th className="border-0 bg-transparent text-muted small fw-bold py-3 text-center" style={{ width: '12%', letterSpacing: '1px' }}>HÀNH ĐỘNG</th>
                                            <th className="border-0 bg-transparent text-muted small fw-bold py-3" style={{ width: '15%', letterSpacing: '1px' }}>ĐỐI TƯỢNG</th>
                                            <th className="border-0 bg-transparent text-muted small fw-bold py-3" style={{ letterSpacing: '1px' }}>MÔ TẢ HOẠT ĐỘNG</th>
                                            <th className="border-0 bg-transparent text-muted small fw-bold py-3 text-center" style={{ width: '12%', letterSpacing: '1px' }}>THAO TÁC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-0">
                                        {activityLogs.map((log) => {
                                            const actionInfo = getVnAction(log.actionType);
                                            return (
                                                <tr key={log.id} style={{ cursor: "pointer" }} onClick={() => setShowLogDetail(log)}>
                                                    <td className="py-3">
                                                        <div className="text-dark small fw-bold">{new Date(log.timestamp).toLocaleDateString("vi-VN")}</div>
                                                        <div className="text-primary small fw-bold" style={{ fontSize: "0.9rem" }}>{new Date(log.timestamp).toLocaleTimeString("vi-VN")}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="log-avatar-circle me-3">
                                                                {log.adminName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark mb-0" style={{ fontSize: "0.9rem" }}>{log.adminName}</div>
                                                                <div className="text-muted" style={{ fontSize: "0.72rem" }}>{log.adminEmail}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-3">
                                                        <span className={`log-badge-vn bg-${actionInfo.color} bg-opacity-10 text-${actionInfo.color}`}>
                                                            <i className={`bi ${actionInfo.icon} me-1`}></i>
                                                            {actionInfo.text}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="resource-label-vn mb-0">{getVnResource(log.resourceType)}</div>
                                                        <div className="resource-subtext-vn">ID: {log.resourceId?.substring(0, 8)}...</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="text-dark small fw-medium" style={{ lineHeight: "1.4" }}>{formatLogDescription(log.description, log)}</div>
                                                    </td>
                                                    <td className="text-center py-3">
                                                        <div className="d-flex align-items-center justify-content-center gap-3">
                                                            {(!log.isRollbacked && ["CREATE", "UPDATE", "DELETE", "RESTORE"].includes(log.actionType)) && (
                                                                <button
                                                                    className="btn btn-sm btn-soft-danger px-3 py-1 rounded-pill fw-bold d-flex align-items-center gap-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRollback(log.id);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-arrow-counterclockwise fs-6"></i>
                                                                </button>
                                                            )}
                                                            {log.isRollbacked ? (
                                                                <span className="badge-rollback"><i className="bi bi-check-all me-1"></i>Đã hoàn tác</span>
                                                            ) : (
                                                                <div className="btn btn-sm btn-link text-primary p-0" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); setShowLogDetail(log); }}>
                                                                    <i className="bi bi-arrow-right-circle-fill fs-5"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {activityLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5">
                                                    <div className="py-4">
                                                        <i className="bi bi-journal-x fs-1 text-muted opacity-20 d-block mb-3"></i>
                                                        <span className="text-muted fw-bold">Hiện không có dữ liệu hoạt động nào được ghi lại.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>


                            {activityTotalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <nav>
                                        <ul className="pagination pagination-sm gap-1 border-0">
                                            {[...Array(activityTotalPages).keys()].map(p => (
                                                <li key={p} className={`page-item ${p === activityPage ? 'active' : ''}`}>
                                                    <button className="page-link border-0 rounded-pill px-3 fw-bold" onClick={() => setActivityPage(p)}>{p + 1}</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}

                            {/* Log Detail Modal */}
                            {showLogDetail && (
                                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1060, backdropFilter: 'blur(4px)' }}>
                                    <div className="modal-dialog modal-dialog-centered modal-lg">
                                        <div className="log-modal-content modal-content">
                                            {/* Hero Header */}
                                            <div className={`log-hero ${showLogDetail.actionType === 'CREATE' ? 'log-hero-bg-create' :
                                                showLogDetail.actionType === 'UPDATE' ? 'log-hero-bg-update' :
                                                    showLogDetail.actionType === 'DELETE' ? 'log-hero-bg-delete' :
                                                        showLogDetail.actionType === 'LOGIN' ? 'log-hero-bg-login' : 'log-hero-bg-default'
                                                }`}>
                                                <i className={`bi ${showLogDetail.actionType === 'CREATE' ? 'bi-plus-circle-fill' :
                                                    showLogDetail.actionType === 'UPDATE' ? 'bi-pencil-square' :
                                                        showLogDetail.actionType === 'DELETE' ? 'bi-trash-fill' :
                                                            showLogDetail.actionType === 'LOGIN' ? 'bi-box-arrow-in-right' : 'bi-info-circle-fill'
                                                    } log-hero-icon`}></i>

                                                <div className="position-relative z-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <span className="badge bg-white bg-opacity-20 text-white rounded-pill px-3 py-2 small fw-bold">
                                                            <i className="bi bi-tag-fill me-2"></i>{getVnResource(showLogDetail.resourceType)}
                                                        </span>
                                                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogDetail(null)}></button>
                                                    </div>
                                                    <h2 className="display-6 fw-bold mb-1">{getVnAction(showLogDetail.actionType).text}</h2>
                                                    <p className="lead mb-0 opacity-90">{showLogDetail.description}</p>
                                                </div>
                                            </div>

                                            <div className="modal-body p-4 bg-white">
                                                <div className="row g-3 mb-4">
                                                    <div className="col-md-6">
                                                        <div className="log-info-card">
                                                            <span className="log-label-premium">ADMIN TRỰC THI</span>
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar-sm rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold me-3" style={{ width: '40px', height: '40px' }}>
                                                                    {showLogDetail.adminName?.charAt(0) || 'A'}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark small">{showLogDetail.adminName}</div>
                                                                    <div className="small text-muted" style={{ fontSize: '0.7rem' }}>{showLogDetail.adminEmail}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="log-info-card">
                                                            <span className="log-label-premium">THỜI GIAN & IP</span>
                                                            <div className="d-flex align-items-center mb-1">
                                                                <i className="bi bi-calendar3 text-primary me-2 small"></i>
                                                                <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>{new Date(showLogDetail.timestamp).toLocaleString()}</span>
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-geo-alt-fill text-danger me-2 small"></i>
                                                                <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>{showLogDetail.ipAddress || 'Unknown IP'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="log-info-card">
                                                            <span className="log-label-premium">THIẾT BỊ & TRÌNH DUYỆT</span>
                                                            <div className="text-dark" style={{ lineHeight: '1.4', fontSize: '0.75rem' }}>
                                                                <i className="bi bi-laptop me-2 text-muted"></i>
                                                                {showLogDetail.userAgent || 'Unknown User Agent'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="log-label-premium px-2">DỮ LIỆU LOG CHI TIẾT (RAW DATA)</span>
                                                <div className="log-json-container">
                                                    <pre className="mb-0 overflow-visible">
                                                        {JSON.stringify({
                                                            id: showLogDetail.resourceId,
                                                            admin_id: showLogDetail.adminId,
                                                            status: showLogDetail.status,
                                                            timestamp: showLogDetail.timestamp
                                                        }, null, 4)}
                                                    </pre>
                                                </div>
                                            </div>
                                            <div className="modal-footer border-0 bg-light p-3 d-flex justify-content-between">
                                                <div className="d-flex gap-2">
                                                    {(!showLogDetail.isRollbacked && (new Date() - new Date(showLogDetail.timestamp)) < 15 * 60 * 1000 && ['CREATE', 'UPDATE', 'DELETE'].includes(showLogDetail.actionType)) && (
                                                        <button
                                                            className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                                                            onClick={() => {
                                                                handleRollback(showLogDetail.id);
                                                                setShowLogDetail(null);
                                                            }}
                                                        >
                                                            <i className="bi bi-arrow-counterclockwise fs-5"></i>
                                                            Hoàn tác ngay
                                                        </button>
                                                    )}
                                                    {showLogDetail.isRollbacked && (
                                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-4 py-2 border border-success border-opacity-25 d-flex align-items-center">
                                                            <i className="bi bi-check-circle-fill me-2"></i>Dữ liệu đã được hoàn tác
                                                        </span>
                                                    )}
                                                </div>
                                                <button type="button" className="btn btn-dark rounded-pill px-4" onClick={() => setShowLogDetail(null)}>Đóng</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {showUndoToast && undoLog && (
                <div className="rollback-undo-toast shadow-lg">
                    <div className="rollback-timer-container">
                        <svg className="rollback-timer-svg">
                            <circle
                                className="rollback-timer-circle"
                                cx="20"
                                cy="20"
                                r="16"
                                pathLength="100"
                                style={{ strokeDashoffset: (100 - (rollbackCountdown / 15) * 100), strokeDasharray: 100 }}
                            />
                        </svg>
                        <span className="rollback-timer-text">{rollbackCountdown}s</span>
                    </div>
                    <div className="flex-grow-1">
                        <div className="fw-bold text-white-50 text-uppercase mb-0" style={{ letterSpacing: '0.5px', fontSize: '0.55rem', opacity: 0.8 }}>Vừa thực hiện:</div>
                        <div className="text-white fw-bold" style={{ fontSize: '0.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{undoLog.description}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button className="rollback-undo-btn" onClick={() => handleRollback(undoLog.id)}>
                            <i className="bi bi-arrow-counterclockwise fs-5"></i>
                            Hoàn tác
                        </button>
                        <button className="rollback-close-btn ms-2" onClick={() => setShowUndoToast(false)}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
