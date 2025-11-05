export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    updatedAt?: string;
  }
  
  // Tipo para criar perfil (usado no signup)
export interface SignupData {
    email: string;
    password: string;
    name: string;
    role?: string;
  }
