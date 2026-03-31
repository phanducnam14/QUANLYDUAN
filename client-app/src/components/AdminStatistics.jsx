import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LabelList, RadialBarChart, RadialBar } from 'recharts';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import PrivateChatPanel from './PrivateChatPanel';
import { formatDeptName } from '../utils/formatUtils';
import '../pages/AdminDashboard.css';

const AdminStatistics = ({ users = [], departments = [], projects = [], completedProjects = [], tasks = [] }) => {
    const navigate = useNavigate();

    // Data Aggregation logic (Synchronized with Dashboard)
    const allTasks = tasks.length > 0 ? tasks : projects.flatMap(p => p.tasks || []);
    const stats = {
        totalTasks: allTasks.length,
        toDo: allTasks.filter(t => t.status === 'TO_DO').length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        done: allTasks.filter(t => t.status === 'DONE').length,
        
        // Priority breakdown (Taking from Projects as per user feedback)
        byPriority: {
            LOW: projects.filter(p => p.priority === 'LOW').length,
            MEDIUM: projects.filter(p => p.priority === 'MEDIUM').length,
            HIGH: projects.filter(p => p.priority === 'HIGH').length,
            CRITICAL: projects.filter(p => p.priority === 'CRITICAL').length,
        },
        
        // Project statuses (Bản nháp, Đang mở, Đã đóng)
        projectStatuses: [
            { name: 'Bản nháp', value: projects.filter(p => !p.startDate).length, color: '#f59e0b' },
            { name: 'Đang mở', value: projects.filter(p => p.status !== 'CLOSED').length, color: '#4318FF' },
            { name: 'Đã đóng', value: projects.filter(p => p.status === 'CLOSED').length, color: '#05CD99' }
        ]
    };

    // Project Status Chart Data (Ensuring 3 statuses: Hoàn thành, Đang làm, Chưa làm)
    const projectStatusData = [
        { name: 'Hoàn thành', value: projects.filter(p => p.status === 'CLOSED').length, color: '#05CD99' },
        { name: 'Đang làm', value: projects.filter(p => !p.isDeleted && p.status === 'OPEN').length, color: '#4318FF' },
        { name: 'Chưa làm', value: projects.filter(p => p.status === 'DRAFT').length, color: '#A3AED1' }
    ];

    // Priority Data (Adjusted for Project Distribution)
    const priorityData = [
        { name: 'Cao (High)', value: stats.byPriority.HIGH, color: '#dc3545' },
        { name: 'Khẩn cấp (Critical)', value: stats.byPriority.CRITICAL, color: '#9c27b0' },
        { name: 'Trung bình (Medium)', value: stats.byPriority.MEDIUM, color: '#ffc107' },
        { name: 'Thấp (Low)', value: stats.byPriority.LOW, color: '#198754' }
    ].filter(item => item.value > 0 || ['Cao (High)', 'Thấp (Low)', 'Trung bình (Medium)'].includes(item.name));
    // Show even if 0 for Cao/Thấp to match user expectations if they track them.

    // Project Detailed Task Data for Stacked Bar Chart
    const projectProgressData = projects.filter(p => !p.isDeleted).slice(0, 8).map(p => {
        const projectTasks = allTasks.filter(t => t.project?.id === p.id || t.project === p.id);
        
        let done = 0, inProgress = 0, toDo = 0;
        
        if (p.status === 'CLOSED') {
            done = projectTasks.length || 1; // Mark as all done if project closed
        } else {
            projectTasks.forEach(t => {
                if (t.status === 'DONE' || t.completionPercentage === 100) done++;
                else if (t.status === 'IN_PROGRESS' || t.completionPercentage > 0) inProgress++;
                else toDo++;
            });
        }
        
        return {
            name: p.name.length > 15 ? p.name.substring(0, 13) + '...' : p.name,
            'Hoàn thành': done,
            'Đang làm': inProgress,
            'Chưa làm': toDo,
            total: done + inProgress + toDo
        };
    }).sort((a,b) => b.total - a.total);

    // Department Stats
    const deptStats = departments.map(d => ({
        name: formatDeptName(d.name),
        total: users.filter(u => u.department?.id === d.id).length
    })).sort((a,b) => b.total - a.total);

    // Performance (Top 5 based on actual task progress)
    const performanceData = users
        .filter(u => u.role === 'EMPLOYEE')
        .map(u => {
            const userTasks = allTasks.filter(t => (t.assignee?.id === u.id) || (t.assignee === u.id));
            const avgScore = userTasks.length > 0 
                ? Math.round(userTasks.reduce((acc, t) => acc + (t.completionPercentage || 0), 0) / userTasks.length) 
                : 0;
            return {
                id: u.id,
                name: u.fullName,
                avatar: u.avatarUrl,
                score: avgScore,
                taskCount: userTasks.length,
                dept: u.department ? formatDeptName(u.department.name) : 'Freelance'
            };
        }).sort((a,b) => b.score - a.score || b.taskCount - a.taskCount).slice(0, 5);

    return (
        <div className="admin-statistics-aligned animate-fade-in pb-5 px-xl-2">
            <style>{`
                .stats-section-title {
                    color: #707EAE;
                    font-weight: 800;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 40px 0 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .stats-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #f4f7fe;
                }
                .kpi-modern {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    border: 1px solid #f4f7fe;
                    height: 100%;
                }
                .kpi-icon-modern {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }
                .chart-container-modern {
                    height: 320px;
                    width: 100%;
                }
                .text-primary-dark {
                    color: #2b3674 !important;
                }
                .modern-btn-dashboard {
                    background: linear-gradient(135deg, #4318ff 0%, #3a15dc 100%);
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    box-shadow: 0 4px 15px rgba(67, 24, 255, 0.2);
                    transition: all 0.3s;
                }
                .modern-btn-dashboard:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(67, 24, 255, 0.3);
                }
                /* Original styles kept for others */
                .performance-item {
                    padding: 16px;
                    border-radius: 16px;
                    background: white;
                    margin-bottom: 15px;
                    border: 1px solid #f4f7fe;
                    transition: all 0.2s;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                }
                .performance-item:hover {
                    box-shadow: 0 10px 20px rgba(112, 144, 176, 0.1);
                    transform: translateX(5px);
                    border-color: #4318ff20;
                }
                .rank-badge {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.75rem;
                    margin-right: 12px;
                }
                .rank-1 { background: #FFD70020; color: #FFD700; border: 1px solid #FFD70040; }
                .rank-2 { background: #C0C0C020; color: #C0C0C0; border: 1px solid #C0C0C040; }
                .rank-3 { background: #CD7F3220; color: #CD7F32; border: 1px solid #CD7F3240; }
                .rank-other { background: #f4f7fe; color: #a3aed0; }
                
                .perf-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    object-fit: cover;
                    background: #f4f7fe;
                }
                .perf-progress-container {
                    flex: 1;
                    padding-left: 15px;
                }
            `}</style>

            {/* Header Row */}
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h2 className="fw-800 text-primary-dark mb-1 fs-2">Thống kê Tổng quát</h2>
                    <p className="text-muted fw-bold small mb-0 opacity-75">Báo cáo phân tích hiệu suất và tiến độ</p>
                </div>
                <button className="modern-btn-dashboard" onClick={() => navigate('/admin/users')}>
                    <i className="bi bi-grid-fill me-2"></i> TRUY CẬP DASHBOARD
                </button>
            </div>

            {/* KPI Row */}
            <div className="row g-4 mb-3">
                <div className="col-md-3">
                    <div className="kpi-modern">
                        <div className="kpi-icon-modern bg-primary bg-opacity-10 text-primary"><i className="bi bi-stack"></i></div>
                        <div>
                            <div className="text-muted small fw-800" style={{fontSize: '0.65rem'}}>TỔNG NHIỆM VỤ</div>
                            <h3 className="fw-800 text-primary-dark mb-0">{stats.totalTasks}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="kpi-modern">
                        <div className="kpi-icon-modern bg-warning bg-opacity-10 text-warning"><i className="bi bi-clock-history"></i></div>
                        <div>
                            <div className="text-muted small fw-800" style={{fontSize: '0.65rem'}}>ĐANG CHỜ</div>
                            <h3 className="fw-800 text-primary-dark mb-0">{stats.toDo}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="kpi-modern">
                        <div className="kpi-icon-modern bg-info bg-opacity-10 text-info"><i className="bi bi-lightning-fill"></i></div>
                        <div>
                            <div className="text-muted small fw-800" style={{fontSize: '0.65rem'}}>ĐANG LÀM</div>
                            <h3 className="fw-800 text-primary-dark mb-0">{stats.inProgress}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="kpi-modern">
                        <div className="kpi-icon-modern bg-success bg-opacity-10 text-success"><i className="bi bi-check-circle-fill"></i></div>
                        <div>
                            <div className="text-muted small fw-800" style={{fontSize: '0.65rem'}}>HOÀN THÀNH</div>
                            <h3 className="fw-800 text-primary-dark mb-0">{stats.done}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1 */}
            <div className="stats-section-title">
                <i className="bi bi-bar-chart-fill"></i> PHÂN PHỐI CÔNG VIỆC
            </div>
            <div className="row g-4">
                <div className="col-md-5">
                    <div className="modern-card">
                        <div className="modern-card-header">Trạng thái Dự án</div>
                        <div className="card-body p-4">
                            <div className="chart-container-modern">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={projectStatusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                            {projectStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-7">
                    <div className="modern-card">
                        <div className="modern-card-header">Phân bổ Độ ưu tiên</div>
                        <div className="card-body p-4">
                            <div className="chart-container-modern">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={priorityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f7fe" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#707EAE', fontWeight: 700}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#707EAE', fontWeight: 700}} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                                            {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2 */}
            <div className="stats-section-title">
                <i className="bi bi-building"></i> DỰ ÁN & PHÒNG BAN
            </div>
            <div className="row g-4">
                {/* Departments */}
                <div className="col-md-5">
                    <div className="modern-card h-100">
                        <div className="modern-card-header">Nhân sự theo Phòng ban</div>
                        <div className="card-body p-4 text-center">
                            <div className="chart-container-modern">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deptStats} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontWeight: 700, fill: '#707EAE', fontSize: 11}} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="total" fill="#4318FF" radius={[0, 10, 10, 0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Progress Chart - Stacked Analytics Style */}
                <div className="col-md-7">
                    <div className="modern-card h-100">
                        <div className="modern-card-header">Phân bổ Nhiệm vụ theo Dự án</div>
                        <div className="card-body p-4">
                            <div className="chart-container-modern" style={{height: '350px'}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={projectProgressData}
                                        layout="vertical"
                                        margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f7fe" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fontWeight: 700, fill: '#707EAE', fontSize: 11}} />
                                        <Tooltip 
                                            cursor={{fill: '#f4f7fe'}}
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                        />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '11px', fontWeight: 700}} />
                                        <Bar dataKey="Hoàn thành" stackId="a" fill="#05CD99" barSize={25} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Đang làm" stackId="a" fill="#4318FF" barSize={25} />
                                        <Bar dataKey="Chưa làm" stackId="a" fill="#f4f7fe" barSize={25} radius={[0, 10, 10, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3 */}
            <div className="stats-section-title">
                <i className="bi bi-award-fill"></i> HIỆU SUẤT NHÂN SỰ
            </div>
            <div className="row g-4 mb-5">
                <div className="col-md-12">
                    <div className="modern-card">
                        <div className="modern-card-header">Top 5 Thành viên Xuất sắc</div>
                        <div className="card-body p-4">
                            <div className="row">
                                {performanceData.length > 0 ? performanceData.map((u, idx) => (
                                    <div key={u.id || idx} className="col-md-6 col-lg-4 col-xl-4">
                                        <div className="performance-item shadow-sm d-flex align-items-center">
                                            {/* Rank Badge */}
                                            <div className={`rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'}`}>
                                                {idx + 1}
                                            </div>
                                            
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt="" className="perf-avatar shadow-sm" />
                                                ) : (
                                                    <div className="perf-avatar d-flex align-items-center justify-content-center fw-bold text-primary">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info & Progress */}
                                            <div className="perf-progress-container">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <div className="text-start">
                                                        <div className="fw-800 text-primary-dark small mb-0">{u.name}</div>
                                                        <div className="text-muted" style={{fontSize: '0.65rem'}}>{u.dept} • {u.taskCount} việc</div>
                                                    </div>
                                                    <span className={`fw-800 fs-6 ${u.score >= 80 ? 'text-success' : u.score >= 50 ? 'text-primary' : 'text-warning'}`}>
                                                        {u.score}%
                                                    </span>
                                                </div>
                                                <div className="progress" style={{height: '8px', backgroundColor: '#f4f7fe', borderRadius: '10px'}}>
                                                    <div 
                                                        className={`progress-bar rounded-pill ${u.score >= 80 ? 'bg-success' : u.score >= 50 ? 'bg-primary' : 'bg-warning'}`} 
                                                        style={{width: `${u.score}%`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-12 text-center py-4 text-muted opacity-50 fst-italic">Chưa có dữ liệu hiệu suất nhân sự.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStatistics;
