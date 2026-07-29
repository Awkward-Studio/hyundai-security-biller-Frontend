import { account, createUser, logoutUser, type UserRole } from "@/lib/api";

class UserManager {
  async createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) {
    return createUser(email, password, role, name);
  }

  async getCurrentUser() {
    return account.get();
  }

  async updateName() {
    throw new Error("Profile updates are handled from the Django admin.");
  }

  async updateEmail() {
    throw new Error("Profile updates are handled from the Django admin.");
  }

  async updatePreferences() {
    throw new Error("Preferences are not implemented in the Django API.");
  }

  async updatePassword() {
    throw new Error("Password updates are handled from the Django admin.");
  }

  async logout() {
    return logoutUser();
  }

  async initiatePasswordRecovery() {
    throw new Error("Password recovery is not implemented in the Django API.");
  }

  async completePasswordRecovery() {
    throw new Error("Password recovery is not implemented in the Django API.");
  }
}

export default UserManager;
