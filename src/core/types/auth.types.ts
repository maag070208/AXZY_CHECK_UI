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
  roleId: number;
}

export interface IDecodedToken {
  id: number;
  name: string;
  lastName: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}
