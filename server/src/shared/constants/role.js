export const APPLICATION_ROLES = {
  SUPER_ADMIN: "super_admin",
  CLIENT_VIEWER: "client_viewer",
  CLIENT_ADMIN: 'client_admin'
};

export const CLIENT_ROLES = [
    'client_viewer',
    'client_admin'
]

export const isValidClientRole = (role) => {
  return CLIENT_ROLES.includes(role);
};


export const isValidRole = (role) => {
    return Object.values(APPLICATION_ROLES).includes(role)
}
   