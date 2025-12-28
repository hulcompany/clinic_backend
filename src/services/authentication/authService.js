const userRepository = require('../../repositories/authentication/user.repository');

// Register user
const registerUser = async (userData) => {
  const { full_name, email, password, phone, image } = userData;

  // Check if user already exists (by email if provided, otherwise by phone)
  let existingUser = null;
  if (email) {
    existingUser = await userRepository.getUserByEmail(email);
  } else if (phone) {
    existingUser = await userRepository.getUserByPhone(phone);
  }

  if (existingUser) {
    if (email && existingUser.email === email) {
      throw new Error('User already exists with this email');
    } else if (phone && existingUser.phone === phone) {
      throw new Error('User already exists with this phone number');
    }
  }

  // Create user
  const user = await userRepository.createUser({
    full_name,
    email: email || null,
    password: password || null,
    phone: phone || null,
    image: image || null
  });

  return {
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      image: user.image
    }
  };
};

// Login user
const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Find user by email or phone
  let user = null;
  if (email.includes('@')) {
    user = await userRepository.getUserByEmail(email);
  } else {
    user = await userRepository.getUserByPhone(email);
  }

  if (!user) {
    throw new Error('No user found with this email or phone number');
  }

  // Check if password matches (only if password exists)
  if (user.password) {
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      throw new Error('Incorrect password');
    }
  } else {
    // If no password is set, reject login
    throw new Error('Account has no password set');
  }

  // Check if user account is active/verified
  if (!user.is_active) {
    throw new Error('Please verify your email before logging in');
  }

  return {
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      is_active: user.is_active
    }
  };
};

module.exports = {
  registerUser,
  loginUser
};