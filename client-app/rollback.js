const fs = require('fs');
const file = 'src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const start = 600;
const end = 932;
const original = \$(                                    { label: 'Tru?ng phòng', value: users.filter(u => u.role === 'MANAGER').length, icon: 'bi-briefcase-fill', color: '#f59e0b', bg: '#fffbeb' },
                                    { label: 'Ðang ho?t d?ng', value: users.filter(u => u.active !== false).length, icon: 'bi-check-circle-fill', color: '#10b981', bg: '#ecfdf5' },
                                ].map((s, i) => (
                                    <div key={i} className="col-6 col-md-3">
                                        <div className="d-flex align-items-center gap-3 bg-white rounded-4 p-3 shadow-sm border border-light h-100" style={{borderLeft: \4px solid \ !important\}}>
                                            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{width:46, height:46, background: s.bg}}>
                                                <i className={\i \ fs-4\} style={{color: s.color}}></i>
                                            </div>
                                            <div>
                                                <div className="fw-800 fs-4 lh-1" style={{color: s.color}}>{s.value}</div>
                                                <div className="text-muted small fw-semibold">{s.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="row g-4">
                                {/* -- ADD FORM -- */}
                                <div className="col-12 col-xl-3">
                                    <div className="bg-white rounded-4 shadow-sm border-0 overflow-hidden h-100" style={{border: '1px solid #f1f5f9'}}>
                                        {/* Form Header */}
                                        <div className="px-4 pt-4 pb-3" style={{background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'}}>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{width:32,height:32}}>
                                                    <i className="bi bi-person-plus-fill text-white fs-6"></i>
                                                </div>
                                                <span className="fw-800 text-white" style={{letterSpacing:'0.5px'}}>THÊM NHÂN S?</span>
                                            </div>
                                            <p className="text-white mb-0" style={{opacity:0.7, fontSize:'0.72rem'}}>Ði?n d?y d? thông tin nhân viên m?i</p>
                                        </div>

                                        <div className="p-4">
                                            {/* Avatar Upload */}
                                            <div className="text-center mb-4">
                                                <div className="position-relative d-inline-block">
                                                    {avatarPreview ? (
                                                        <img src={avatarPreview} alt="Preview" className="rounded-circle shadow" style={{width:90,height:90,objectFit:'cover',border:'3px solid #6366f1'}} />
                                                    ) : (
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width:90,height:90,background:'linear-gradient(135deg,#eef2ff,#e0e7ff)',border:'3px dashed #a5b4fc'}}>
                                                            <i className="bi bi-person-fill" style={{fontSize:'2rem',color:'#6366f1'}}></i>
                                                        </div>
                                                    )}
                                                    <button type="button" className="position-absolute bottom-0 end-0 rounded-circle border-0 d-flex align-items-center justify-content-center shadow-sm" style={{width:28,height:28,background:'#6366f1',color:'#fff'}} onClick={handleEditAvatar} title="Ch?n ?nh">
                                                        <i className="bi bi-camera-fill" style={{fontSize:'0.7rem'}}></i>
                                                    </button>
                                                    <input type="file" id="avatarInput" accept="image/png,image/jpeg,image/jpg" onChange={handleAvatarSelect} style={{display:'none'}} />
                                                </div>
                                                {avatarPreview && (
                                                    <div className="mt-2">
                                                        <button type="button" className="btn btn-sm text-danger border-0 p-0 fw-semibold" style={{fontSize:'0.72rem'}} onClick={handleRemoveAvatar}>
                                                            <i className="bi bi-trash me-1"></i>Xóa ?nh
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <form onSubmit={handleAddUser}>
                                                {/* H? tên */}
                                                <div className="mb-3">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize:'0.72rem',letterSpacing:'0.5px',textTransform:'uppercase'}}>H? và tên <span className="text-danger">*</span></label>
                                                    <div className="input-group-modern">
                                                        <i className="bi bi-person"></i>
                                                        <input className="form-control modern-field" placeholder="Nguy?n Van A" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                                                    </div>
                                                </div>

                                                {/* Email h? th?ng */}
                                                <div className="mb-3">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize:'0.72rem',letterSpacing:'0.5px',textTransform:'uppercase'}}>Email h? th?ng <span className="text-danger">*</span></label>
                                                    <div className="input-group-modern">
                                                        <i className="bi bi-envelope"></i>
                                                        <input className="form-control modern-field" type="email" placeholder="nhanvien@company.com" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                                                    </div>
                                                </div>

                                                {/* Google Email */}
                                                <div className="mb-3">
                                                    <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center gap-1" style={{fontSize:'0.72rem',letterSpacing:'0.5px',textTransform:'uppercase'}}>
                                                        <svg width="12" height="12" viewBox="0 0 48 48" style={{flexShrink:0}}><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                                                        Google Email <span className="text-muted fw-normal">(tu? ch?n)</span>
                                                    </label>
                                                    <div className="input-group-modern">
                                                        <i className="bi bi-google" style={{color:'#4285F4'}}></i>
                                                        <input className="form-control modern-field" type="email" placeholder="user@gmail.com" value={newUser.googleEmail || ''} onChange={e => setNewUser({...newUser, googleEmail: e.target.value})} />
                                                    </div>
                                                    <div className="text-muted mt-1" style={{fontSize:'0.65rem'}}>
                                                        <i className="bi bi-info-circle me-1"></i>Dùng d? dang nh?p b?ng Google OAuth
                                                    </div>
                                                </div>

                                                {/* M?t kh?u */}
                                                <div className="mb-3">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize:'0.72rem',letterSpacing:'0.5px',textTransform:'uppercase'}}>M?t kh?u <span className="text-danger">*</span></label>
                                                    <div className="input-group-modern">
                                                        <i className="bi bi-lock"></i>
                                                        <input className="form-control modern-field" type="password" placeholder="••••••••" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                                    </div>
                                                </div>

                                                {/* Phòng ban */}
                                                <div className="mb-3">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize:'0.72rem',letterSpacing:'0.5px',textTransform:'uppercase'}}>Phòng ban</label>
                                                    <div className="input-group-modern">
                                                        <i className="bi bi-building"></i>
                                                        <select className="form-select modern-field" value={newUser.deptId} onChange={e => setNewUser({...newUser, deptId: e.target.value})}>
                                                            <option value="">-- Chua phân công --</option>
                                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Vai trò */}
                                                <div className="mb-4">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize:'0.72rem',letterSpacing:'0.5px',textTransform:'uppercase'}}>Vai trò</label>
                                                    <div className="d-flex gap-2 flex-wrap">
                                                        {[{v:'EMPLOYEE',l:'Nhân viên',c:'#0ea5e9'},{v:'MANAGER',l:'Tru?ng phòng',c:'#f59e0b'},{v:'ADMIN',l:'Admin',c:'#ef4444'}].map(r => (
                                                            <label key={r.v} className="d-flex align-items-center gap-1 px-2 py-1 rounded-3 border cursor-pointer" style={{cursor:'pointer', background: newUser.role===r.v ? r.c+'22' : '#f8fafc', borderColor: newUser.role===r.v ? r.c : '#e2e8f0', transition:'all 0.15s'}}>
                                                                <input type="radio" name="role" value={r.v} checked={newUser.role===r.v} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{display:'none'}} />
                                                                <span className="fw-semibold" style={{fontSize:'0.72rem', color: newUser.role===r.v ? r.c : '#64748b'}}>{r.l}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button type="submit" className="w-100 py-2 fw-bold text-white border-0 rounded-3 d-flex align-items-center justify-content-center gap-2" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',fontSize:'0.85rem',letterSpacing:'0.5px',boxShadow:'0 4px 12px rgba(99,102,241,0.4)'}}>
                                                    <i className="bi bi-person-plus-fill"></i> T?O NHÂN S?
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                {/* -- USERS TABLE -- */}
                                <div className="col-12 col-xl-9">
                                    <div className="bg-white rounded-4 shadow-sm overflow-hidden h-100" style={{border:'1px solid #f1f5f9'}}>
                                        {/* Table Toolbar */}
                                        <div className="px-4 py-3 d-flex justify-content-between align-items-center border-bottom" style={{background:'#fafbff'}}>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-800 text-dark">Danh sách nhân s?</span>
                                                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2" style={{fontSize:'0.7rem'}}>{filteredUsers.length} ngu?i</span>
                                            </div>
                                            {/* Search inline */}
                                            <form onSubmit={handleSearchUser} className="d-flex align-items-center gap-2">
                                                <div className="position-relative">
                                                    <i className="bi bi-search position-absolute text-muted" style={{left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.8rem'}}></i>
                                                    <input
                                                        className="form-control border-0 shadow-sm rounded-pill"
                                                        placeholder="Tìm theo tên, email..."
                                                        value={searchTerm}
                                                        onChange={e => { setSearchTerm(e.target.value); setUsersPage(1); }}
                                                        style={{paddingLeft:32, paddingRight:36, fontSize:'0.82rem', background:'#f1f5f9', minWidth:220, height:36}}
                                                    />
                                                    {searchTerm && (
                                                        <button type="button" className="position-absolute border-0 bg-transparent text-muted" style={{right:10,top:'50%',transform:'translateY(-50%)'}} onClick={() => { setSearchTerm(''); handleResetSearch(); setUsersPage(1); }}>
                                                            <i className="bi bi-x-lg" style={{fontSize:'0.7rem'}}></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </form>
                                        </div>

                                        {/* Table */}
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0" style={{fontSize:'0.85rem'}}>
                                                <thead>
                                                    <tr style={{background:'#f8fafc', borderBottom:'2px solid #e2e8f0'}}>
                                                        <th className="ps-4 py-3 text-uppercase text-muted fw-700" style={{fontSize:'0.65rem',letterSpacing:'0.8px',width:52}}>?nh</th>
                                                        <th className="py-3 text-uppercase text-muted fw-700" style={{fontSize:'0.65rem',letterSpacing:'0.8px'}}>Nhân viên</th>
                                                        <th className="py-3 text-uppercase text-muted fw-700" style={{fontSize:'0.65rem',letterSpacing:'0.8px'}}>Email</th>
                                                        <th className="py-3 text-uppercase text-muted fw-700" style={{fontSize:'0.65rem',letterSpacing:'0.8px'}}>Phòng ban</th>
                                                        <th className="py-3 text-uppercase text-muted fw-700" style={{fontSize:'0.65rem',letterSpacing:'0.8px'}}>Vai trò</th>
                                                        <th className="py-3 text-uppercase text-muted fw-700 text-center" style={{fontSize:'0.65rem',letterSpacing:'0.8px'}}>Tr?ng thái</th>
                                                        <th className="pe-4 py-3 text-uppercase text-muted fw-700 text-end" style={{fontSize:'0.65rem',letterSpacing:'0.8px'}}>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pagedUsers.map(u => {
                                                        const isEditing = editingUserId === u.id;
                                                        const roleColors = { ADMIN: '#ef4444', MANAGER: '#f59e0b', EMPLOYEE: '#0ea5e9' };
                                                        const roleLabels = { ADMIN: '?? Admin', MANAGER: '?? Manager', EMPLOYEE: '?? Employee' };
                                                        return (
                                                            <tr key={u.id} style={{borderBottom:'1px solid #f1f5f9', transition:'background 0.15s'}}
                                                                onMouseEnter={e=>e.currentTarget.style.background='#fafbff'}
                                                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                                                                {/* Avatar */}
                                                                <td className="ps-4">
                                                                    {u.avatarUrl ? (
                                                                        <img src={u.avatarUrl} alt={u.fullName} style={{width:38,height:38,objectFit:'cover',borderRadius:'50%',border:'2px solid #e2e8f0'}} />
                                                                    ) : (
                                                                        <div className="d-flex align-items-center justify-content-center fw-800 text-white rounded-circle" style={{width:38,height:38,background:\linear-gradient(135deg,\,\)\,fontSize:'0.9rem'}}>
                                                                            {u.fullName?.charAt(0).toUpperCase() || '?'}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                {/* Name */}
                                                                <td>
                                                                    <div className="fw-700 text-dark lh-1 mb-1" style={{fontSize:'0.88rem'}}>{u.fullName}</div>
                                                                    <div className="text-muted" style={{fontSize:'0.7rem'}}><i className="bi bi-calendar2 me-1"></i>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '--'}</div>
                                                                </td>

                                                                {/* Email */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <div className="d-flex flex-column gap-1">
                                                                            <div className="position-relative">
                                                                                <i className="bi bi-envelope position-absolute text-muted" style={{left:8,top:'50%',transform:'translateY(-50%)',fontSize:'0.75rem',pointerEvents:'none'}}></i>
                                                                                <input
                                                                                    className="form-control form-control-sm rounded-3"
                                                                                    value={editEmail}
                                                                                    onChange={e => setEditEmail(e.target.value)}
                                                                                    placeholder="Email h? th?ng"
                                                                                    style={{fontSize:'0.78rem', paddingLeft:26, borderColor:'#6366f1'}}
                                                                                />
                                                                            </div>
                                                                            <div className="position-relative">
                                                                                <i className="bi bi-google position-absolute" style={{left:8,top:'50%',transform:'translateY(-50%)',fontSize:'0.75rem',color:'#4285F4',pointerEvents:'none'}}></i>
                                                                                <input
                                                                                    className="form-control form-control-sm rounded-3"
                                                                                    value={editGoogleEmail}
                                                                                    onChange={e => setEditGoogleEmail(e.target.value)}
                                                                                    placeholder="Google Email (tu? ch?n)"
                                                                                    type="email"
                                                                                    style={{fontSize:'0.78rem', paddingLeft:26, borderColor:'#4285F433'}}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <div className="text-secondary" style={{fontSize:'0.8rem'}}><i className="bi bi-envelope me-1 opacity-50"></i>{u.email}</div>
                                                                            {u.googleEmail && <div className="text-muted mt-1" style={{fontSize:'0.68rem'}}><i className="bi bi-google me-1" style={{color:'#4285F4'}}></i>{u.googleEmail}</div>}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                {/* Dept */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm rounded-3" value={editDeptId} onChange={e => setEditDeptId(e.target.value)} style={{fontSize:'0.8rem'}}>
                                                                            <option value="">-- Không có --</option>
                                                                            {departments.map(d => <option key={d.id} value={d.id}>{formatDeptName(d.name)}</option>)}
                                                                        </select>
                                                                    ) : (
                                                                        u.department?.name
                                                                            ? <span className="px-2 py-1 rounded-2 fw-semibold" style={{background:'#eff6ff',color:'#3b82f6',fontSize:'0.72rem'}}><i className="bi bi-building me-1"></i>{formatDeptName(u.department.name)}</span>
                                                                            : <span className="text-muted" style={{fontSize:'0.75rem'}}>—</span>
                                                                    )}
                                                                </td>

                                                                {/* Role */}
                                                                <td>
                                                                    {isEditing ? (
                                                                        <select className="form-select form-select-sm rounded-3" value={editRole} onChange={e => setEditRole(e.target.value)} style={{fontSize:'0.8rem'}}>
                                                                            <option value="EMPLOYEE">Nhân viên</option>
                                                                            <option value="MANAGER">Tru?ng phòng</option>
                                                                            <option value="ADMIN">Admin</option>
                                                                        </select>
                                                                    ) : (
                                                                        <span className="px-2 py-1 rounded-pill fw-700" style={{background: roleColors[u.role]+'18', color: roleColors[u.role], fontSize:'0.72rem', border:\1px solid \33\}}>
                                                                            {roleLabels[u.role] || u.role}
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* Status */}
                                                                <td className="text-center">
                                                                    {u.active !== false
                                                                        ? <span className="px-2 py-1 rounded-pill fw-700" style={{background:'#ecfdf5',color:'#10b981',fontSize:'0.7rem',border:'1px solid #a7f3d0'}}>? Ho?t d?ng</span>
                                                                        : <span className="px-2 py-1 rounded-pill fw-700" style={{background:'#fef2f2',color:'#ef4444',fontSize:'0.7rem',border:'1px solid #fecaca'}}>? T?m khóa</span>
                                                                    }
                                                                </td>

                                                                {/* Actions */}
                                                                <td className="pe-4 text-end">
                                                                    {u.role !== 'ADMIN' && (
                                                                        isEditing ? (
                                                                            <div className="d-flex justify-content-end gap-1">
                                                                                <button className="btn btn-sm fw-700 text-white border-0 px-3 py-1 rounded-3" style={{background:'#10b981',fontSize:'0.75rem'}} onClick={handleSaveEdit}>
                                                                                    <i className="bi bi-check-lg me-1"></i>Luu
                                                                                </button>
                                                                                <button className="btn btn-sm fw-700 border-0 px-2 py-1 rounded-3" style={{background:'#f1f5f9',color:'#64748b',fontSize:'0.75rem'}} onClick={handleCancelEdit}>
                                                                                    <i className="bi bi-x-lg"></i>
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="d-flex justify-content-end gap-1">
                                                                                <button className="btn btn-sm border-0 rounded-3 d-flex align-items-center justify-content-center" style={{width:32,height:32,background:'#eff6ff',color:'#3b82f6'}} onClick={() => handleEditUser(u.id)} title="Ch?nh s?a">
                                                                                    <i className="bi bi-pencil-fill" style={{fontSize:'0.75rem'}}></i>
                                                                                </button>
                                                                                <button className="btn btn-sm border-0 rounded-3 d-flex align-items-center justify-content-center" style={{width:32,height:32,background:'#fef2f2',color:'#ef4444'}} onClick={() => handleDeleteUser(u.id)} title="Xóa">
                                                                                    <i className="bi bi-trash3-fill" style={{fontSize:'0.75rem'}}></i>
                                                                                </button>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {pagedUsers.length === 0 && (
                                                        <tr>
                                                            <td colSpan="7" className="text-center py-5">
                                                                <i className="bi bi-people text-muted fs-1 d-block mb-2 opacity-25"></i>
                                                                <span className="text-muted fw-semibold">Không tìm th?y nhân viên nào</span>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="px-4 py-3 d-flex justify-content-between align-items-center border-top" style={{background:'#fafbff'}}>
                                                <span className="text-muted" style={{fontSize:'0.78rem'}}>Hi?n th? {(usersPage-1)*usersPerPage+1}–{Math.min(usersPage*usersPerPage,filteredUsers.length)} / {filteredUsers.length}</span>
                                                <div className="d-flex gap-1">
                                                    <button className="btn btn-sm border-0 rounded-3 px-2" style={{background: usersPage===1?'#f1f5f9':'#f1f5f9', color:'#64748b'}} disabled={usersPage===1} onClick={()=>setUsersPage(p=>p-1)}>
                                                        <i className="bi bi-chevron-left"></i>
                                                    </button>
                                                    {[...Array(totalPages)].map((_,i) => (
                                                        <button key={i} className="btn btn-sm border-0 rounded-3 px-3 fw-700" style={{background: usersPage===i+1?'#6366f1':'#f1f5f9', color: usersPage===i+1?'#fff':'#64748b', fontSize:'0.8rem'}} onClick={()=>setUsersPage(i+1)}>{i+1}</button>
                                                    ))}
                                                    <button className="btn btn-sm border-0 rounded-3 px-2" style={{background:'#f1f5f9', color:'#64748b'}} disabled={usersPage===totalPages} onClick={()=>setUsersPage(p=>p+1)}>
                                                        <i className="bi bi-chevron-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>.Replace('', '\'))\;
lines.splice(start, end - start + 1, original);
fs.writeFileSync(file, lines.join('\n'));

