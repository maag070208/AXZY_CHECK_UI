export interface IAuthLogin {
  username: string;
  password: string;
}

export interface IAuthRegister {
  name: string;
  lastName: string;
  username: string;
  email?: string;
  password: string;
  roleId: string;
}

export interface IDecodedToken {
  id: string;
  name: string;
  lastName: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}
