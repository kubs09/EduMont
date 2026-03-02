import bcryptjs from 'bcryptjs';

const { genSalt, hash, compare } = bcryptjs;

const hashPassword = async (password) => {
  const salt = await genSalt(10);
  return await hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await compare(plainPassword.trim(), hashedPassword);
};

export default {
  hashPassword,
  comparePassword,
};
