let db;

function init(supabaseClient) {
  db = supabaseClient;
}

async function assertAdmin(callerUserId) {
  const { data, error } = await db
    .from('user_roles')
    .select('role')
    .eq('user_id', callerUserId)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) throw new Error(`[login-user-management/service] assertAdmin failed: ${error.message}`);
  if (!data) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

async function createUser(payload, callerUserId) {
  await assertAdmin(callerUserId);
  const { email, password, name, role: newRole } = payload;
  if (!email || !password || !name) {
    throw new Error('email, password, and name are required');
  }
  const assignedRole = newRole === 'admin' ? 'admin' : 'user';
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: assignedRole },
  });
  if (error) throw new Error(`[login-user-management/service] createUser failed: ${error.message}`);
  return { userId: created.user.id, message: 'User created' };
}

async function updateUser(payload, callerUserId) {
  await assertAdmin(callerUserId);
  const { userId, name, email, status, password } = payload;
  if (!userId || !name || !email) {
    throw new Error('userId, name, and email are required');
  }

  const { data: targetRole, error: roleErr } = await db
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (roleErr) throw new Error(`[login-user-management/service] updateUser role lookup failed: ${roleErr.message}`);
  if (!targetRole) throw new Error('User not found');

  const updateAuth = {
    email,
    user_metadata: { name, role: targetRole.role },
  };
  if (password && String(password).length > 0) updateAuth.password = password;

  const { error: updAuthErr } = await db.auth.admin.updateUserById(userId, updateAuth);
  if (updAuthErr) throw new Error(`[login-user-management/service] updateUser auth failed: ${updAuthErr.message}`);

  const { error: profErr } = await db
    .from('profiles')
    .update({
      name,
      email,
      status: status ?? 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (profErr) throw new Error(`[login-user-management/service] updateUser profile failed: ${profErr.message}`);

  return { message: 'User updated' };
}

async function deleteUser(userId, callerUserId) {
  await assertAdmin(callerUserId);
  if (!userId) throw new Error('userId is required');
  if (userId === callerUserId) throw new Error('You cannot delete your own account');

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`[login-user-management/service] deleteUser failed: ${error.message}`);
  return { message: 'User deleted' };
}

async function createBootstrapAdmin({ email, password, name }) {
  const adminEmail = email ?? 'admin@example.com';
  const adminPassword = password ?? 'ChangeMe123!';
  const adminName = name ?? 'Administrator';

  const { data: existingUsers, error: listErr } = await db.auth.admin.listUsers();
  if (listErr) throw new Error(`[login-user-management/service] createBootstrapAdmin list failed: ${listErr.message}`);

  const userExists = existingUsers?.users?.some((u) => u.email === adminEmail);
  if (userExists) {
    return { message: `User ${adminEmail} already exists` };
  }

  const { data: newUser, error: createErr } = await db.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { name: adminName, role: 'admin' },
  });
  if (createErr) throw new Error(`[login-user-management/service] createBootstrapAdmin failed: ${createErr.message}`);

  return { message: `Admin ${adminEmail} created`, userId: newUser.user.id };
}

module.exports = {
  init,
  createUser,
  updateUser,
  deleteUser,
  createBootstrapAdmin,
};
