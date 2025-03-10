import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  
  
jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };  

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form', () => {
      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );
  
      expect(getByText('LOGIN FORM')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    });
      
    it('inputs should be initially empty', () => {
      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );
  
      expect(getByText('LOGIN FORM')).toBeInTheDocument();
      expect(getByPlaceholderText('Enter Your Email').value).toBe('');
      expect(getByPlaceholderText('Enter Your Password').value).toBe('');
    });
    
    it('should allow typing email and password', () => {
      const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
      expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
    });
    
    it('should login the user successfully', async () => {
      axios.post.mockResolvedValueOnce({
          data: {
              success: true,
              user: { id: 1, name: 'John Doe', email: 'test@example.com' },
              token: 'mockToken'
          }
      });

      const { getByPlaceholderText, getByText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith(undefined, {
          duration: 5000,
          icon: '🙏',
          style: {
              background: 'green',
              color: 'white'
          }
      });
    });

    it('should display error toast for invalid password', async () => {
      // Simulate a failed login attempt (wrong password)
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Invalid password", // error message from API
        },
      });

      const { getByPlaceholderText, getByText } = render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
            </Routes>
        </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'wrongpassword' } });
      fireEvent.click(getByText('LOGIN'));
  
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith("Invalid password");
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it('should display error message on failed login', async () => {
      axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

      const { getByPlaceholderText, getByText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    // Test for empty email field
    it('should show an error for empty email field', async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: '' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      const emailInput = getByPlaceholderText('Enter Your Email');

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          expect(emailInput).toHaveAttribute('required'); 
      });
    });

    // Test for empty password field
    it('should show an error for empty password field', async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
      fireEvent.click(getByText('LOGIN'));

      const passwordInput = getByPlaceholderText('Enter Your Password');

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          expect(passwordInput).toHaveAttribute('required'); 
      });
    });

    // Test for navigating to forgot password page
    it('should navigate to forgot password page', async () => {
      const { getByText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.click(getByText('Forgot Password'));

      await waitFor(() => {
        // Ensure that the "Forgot Password Page" is rendered
        expect(getByText('Forgot Password Page')).toBeInTheDocument();
      });
    });

    // Test for empty form submission
    it('should show an error for empty form submission', async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: '' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
      fireEvent.click(getByText('LOGIN'));
      
      const emailInput = getByPlaceholderText('Enter Your Email');

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          expect(emailInput).toHaveAttribute('required'); 
      });
    });

    // Test for invalid email
    it("should show an error for email with no '@' symbol", async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      const invalidEmail = "userexample.com";

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: invalidEmail } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          // finds an element that contains the specified text
          expect(screen.findByText(`Please include an '@' in the email address. ${invalidEmail}`)).toBeTruthy(); 
      });
    });

    it("should show an error for email with no domain", async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'user@.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          // finds an element that contains the specified text
          expect(screen.findByText("'.' is used at a wrong position in '.com'.")).toBeTruthy(); 
      });
    });

    it("should show an error for email with multiple '@' symbols", async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'user@@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          // finds an element that contains the specified text
          expect(screen.findByText("A part following '@' should not contain the symbol '@'.")).toBeTruthy(); 
      });
    });

    it("should show an error for email with invalid domain", async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'user@example..com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          // finds an element that contains the specified text
          expect(screen.findByText("'.' is used at a wrong position in 'example..com'.")).toBeTruthy(); 
      });
    });

    it("should show an error for email with space", async () => {
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
              <Routes>
                  <Route path="/login" element={<Login />} />
              </Routes>
          </MemoryRouter>
      );

      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'user @example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.click(getByText('LOGIN'));

      await waitFor(() => {
          expect(axios.post).not.toHaveBeenCalled(); // Ensuring no request is sent
          // finds an element that contains the specified text
          expect(screen.findByText("A part followed by '@' should not contain the symbol ' '.")).toBeTruthy(); 
      });
    });

});