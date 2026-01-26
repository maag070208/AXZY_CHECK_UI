export interface IAuthLogin {
  username?: string;
  password: string;
}

export interface IAuthRegister {
    name: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
}
