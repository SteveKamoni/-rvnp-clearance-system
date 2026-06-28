import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../../store/authStore";

const loginSchema = z.object({
  id: z
    .string()
    .min(3, "Admission Number / Staff ID must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

const roles = ["student", "officer", "admin"];

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState('student');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
  // const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: "",
      password: "",
    },
  });

const onSubmit = async (data) => {
  try {
    setLoading(true);
    setError('');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      idNumber: data.id,
      password: data.password,
      role: selectedRole,
    });

    const { token, user } = response.data;

    setAuth(user, token, user.role);
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);

    if (user.role === 'student') navigate('/student/dashboard');
    else if (user.role === 'officer') navigate('/officer/dashboard');
    else navigate('/admin/dashboard');

  } catch (err) {
    setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#0D1B3E] flex items-center justify-center shadow-lg">
            <span className="text-[#C9A84C] text-3xl font-bold">
              RV
            </span>
          </div>

          <h1 className="mt-5 text-center text-2xl font-bold text-[#0D1B3E]">
            Rift Valley National Polytechnic
          </h1>

          <p className="text-gray-600 mt-1">
            Final Clearance Portal
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`rounded-lg py-2 text-sm font-semibold transition-all duration-200 capitalize
                ${
                  selectedRole === role
                    ? "bg-[#0D1B3E] text-[#C9A84C] shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Admission Number / Staff ID
            </label>

            <input
              type="text"
              placeholder="Enter your ID"
              {...register("id")}
              className={`w-full rounded-lg border px-4 py-3 outline-none transition
                ${
                  errors.id
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#0D1B3E]"
                }`}
            />

            {errors.id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className={`w-full rounded-lg border px-4 py-3 outline-none transition
                ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#0D1B3E]"
                }`}
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

{error && (
  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
    {error}
  </div>
)}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0D1B3E] text-[#C9A84C] py-3 rounded-lg font-semibold hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;