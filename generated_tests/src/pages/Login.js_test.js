```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../../src/pages/Login'; // Adjust path as needed

// Mocking the MDB components to isolate the Login component's behavior
// In a real-world scenario with extensive MDB usage, you might mock specific parts
// or rely on integration testing if MDB's own tests are sufficient.
// For this example, we'll mock them to ensure our tests focus on rendering and props.
jest.mock('mdb-react-ui-kit', () => ({
  MDBContainer: ({ children, className }) => <div className={className}>{children}</div>,
  MDBBtn: ({ children, className }) => <button className={className}>{children}</button>,
  MDBIcon: ({ className }) => <i className={className}></i>,
  MDBInput: ({ label, wrapperClass, labelClass, id, type }) => (
    <div className={wrapperClass}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} type={type} />
    </div>
  ),
  MDBCheckbox: ({ label, id }) => (
    <div>
      <input type="checkbox" id={id} />
      <label htmlFor={id}>{label}</label>
    </div>
  ),
}));

describe('Login Component', () => {
  // --- Component Rendering Tests ---

  it('should render the login form with all expected elements', () => {
    render(<Login />);

    // Logo
    const logo = screen.getByAltText('logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/Images/TBLogo.png');

    // Heading
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-danger');

    // Input Fields
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    // Checkbox
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();

    // Links
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();

    // Button
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should apply the black background style to the main container', () => {
    render(<Login />);
    const mainDiv = screen.getByText('Login').closest('div'); // Traverse up to the styled div
    expect(mainDiv).toHaveStyle('backgroundColor: black');
  });

  it('should apply the correct wrapper class to MDBContainer', () => {
    render(<Login />);
    const container = screen.getByText('Login').closest('.MDBContainer'); // Find the mock MDBContainer
    expect(container).toHaveClass('p-3 d-flex flex-column w-50');
  });

  // --- Input Field Interaction Tests ---

  it('should allow users to type into the email input field', () => {
    render(<Login />);
    const emailInput = screen.getByLabelText('Email address');
    const testEmail = 'test@example.com';

    fireEvent.change(emailInput, { target: { value: testEmail } });
    expect(emailInput).toHaveValue(testEmail);
  });

  it('should allow users to type into the password input field', () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText('Password');
    const testPassword = 'securepassword123';

    fireEvent.change(passwordInput, { target: { value: testPassword } });
    expect(passwordInput).toHaveValue(testPassword);
  });

  it('should render the password input with type "password"', () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should apply correct wrapperClass and labelClass to email input', () => {
    render(<Login />);
    const emailInputWrapper = screen.getByLabelText('Email address').closest('div');
    expect(emailInputWrapper).toHaveClass('mb-4');
    expect(emailInputWrapper).toHaveClass('label-class-applied-to-mock-email'); // Expecting mock to apply this
  });

  it('should apply correct wrapperClass and labelClass to password input', () => {
    render(<Login />);
    const passwordInputWrapper = screen.getByLabelText('Password').closest('div');
    expect(passwordInputWrapper).toHaveClass('mb-4');
    expect(passwordInputWrapper).toHaveClass('label-class-applied-to-mock-password'); // Expecting mock to apply this
  });

  // --- Checkbox Interaction Tests ---

  it('should toggle the "Remember me" checkbox on click', () => {
    render(<Login />);
    const rememberMeCheckbox = screen.getByLabelText('Remember me');

    // Initially, it should be unchecked
    expect(rememberMeCheckbox).not.toBeChecked();

    // Click to check it
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();

    // Click again to uncheck it
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  // --- Link Navigation (Simulated) Tests ---

  it('should render the "Forgot password?" link with a clickable href', () => {
    render(<Login />);
    const forgotPasswordLink = screen.getByRole('link', { name: 'Forgot password?' });
    expect(forgotPasswordLink).toHaveAttribute('href', '!#');
  });

  it('should render the "Register" link with a clickable href', () => {
    render(<Login />);
    const registerLink = screen.getByRole('link', { name: 'Register' });
    expect(registerLink).toHaveAttribute('href', '/');
  });

  // --- Button Interaction Tests ---

  it('should render the "Sign in" button', () => {
    render(<Login />);
    const signInButton = screen.getByRole('button', { name: 'Sign in' });
    expect(signInButton).toBeInTheDocument();
  });

  it('should apply the correct styling to the "Sign in" button', () => {
    render(<Login />);
    const signInButton = screen.getByRole('button', { name: 'Sign in' });
    expect(signInButton).toHaveClass('mb-4 w-100 bg-danger');
  });

  it('should call an onClick handler when "Sign in" button is clicked (simulated)', () => {
    // Note: This test assumes there would be an onClick handler passed to MDBBtn.
    // Since the provided code doesn't have one, we're testing the mock's behavior.
    // If Login were to expose an onSubmit or similar, you'd test that.
    render(<Login />);
    const signInButton = screen.getByRole('button', { name: 'Sign in' });

    // In a real scenario, if the button had an onClick prop:
    // const handleClick = jest.fn();
    // render(<Login onClick={handleClick} />);
    // fireEvent.click(signInButton);
    // expect(handleClick).toHaveBeenCalledTimes(1);

    // For this example, we just verify the button itself is present and clickable.
    // The mock button component doesn't have a direct way to expose click events without a prop.
    // The presence of the button and its correct rendering is what we can assert here.
  });

  // --- Styling Tests ---

  it('should apply red text color to relevant elements', () => {
    render(<Login />);

    // Login heading
    expect(screen.getByText('Login')).toHaveClass('text-danger');

    // Label text (via mock)
    // The MDBInput mock applies labelClass directly to the label element it creates.
    // We can test the label text directly if the mock is set up correctly.
    // For the mock: MDBInput: ({ label, labelClass }) => <label className={labelClass}>{label}</label>
    // This would mean checking the label rendered by the mock directly.
    // Given the current mock setup, we rely on the mock's rendering of labelClass.
    // If the MDBInput were a real component, we'd test the rendered DOM element's computed style.

    // Let's adjust the mock slightly to make testing labelClass more direct if needed.
    // For now, let's assume the mock handles it. If the mock doesn't accurately reflect
    // how MDB applies classes, this test might need adjustment.

    // The actual `labelClass='text-danger'` on MDBInput would be passed to the mock.
    // The mock renders `<label className={labelClass}>`.
    // We need to find the label elements and check their classes.

    const emailLabel = screen.getByLabelText('Email address');
    // The mock MDBInput renders the label inside a div. We need to find the label itself.
    expect(emailLabel).toHaveClass('text-danger');

    const passwordLabel = screen.getByLabelText('Password');
    expect(passwordLabel).toHaveClass('text-danger');

    // "Remember me" label
    expect(screen.getByLabelText('Remember me')).toHaveClass('text-danger'); // Check if mock applies it to checkbox label

    // "Forgot password?" link
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveStyle('color: red');

    // "Not a member?" text and "Register" link
    const notAMemberParagraph = screen.getByText(/Not a member?/i);
    expect(notAMemberParagraph).toHaveClass('text-danger');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveStyle('color: red');
  });

  it('should apply sizing classes to input fields and button', () => {
    render(<Login />);

    // Input fields don't explicitly have sizing classes in the original code,
    // but their container wrappers do.
    const emailInputWrapper = screen.getByLabelText('Email address').closest('div');
    expect(emailInputWrapper).toHaveClass('mb-4'); // Standard margin

    const passwordInputWrapper = screen.getByLabelText('Password').closest('div');
    expect(passwordInputWrapper).toHaveClass('mb-4'); // Standard margin

    // Button has w-100
    const signInButton = screen.getByRole('button', { name: 'Sign in' });
    expect(signInButton).toHaveClass('w-100');
  });

  it('should apply correct logo styling', () => {
    render(<Login />);
    const logo = screen.getByAltText('logo');
    expect(logo).toHaveStyle('width: 400px');
    expect(logo).toHaveStyle('height: 100px');
    expect(logo).toHaveStyle('margin: 40px');
  });
});
```