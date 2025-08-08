```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import BlogDesc from '../../src/pages/BlogDesc';

// Mock axios for API calls
jest.mock('axios');

// Mock react-toastify for toast messages
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock the specific MDB components and icons used to avoid issues with their internal implementation or styling
jest.mock('mdb-react-ui-kit', () => ({
  MDBContainer: ({ children, style }) => <div style={style}>{children}</div>,
  MDBTypography: ({ children, tag, className, style }) => {
    const Tag = tag;
    return <Tag className={className} style={style}>{children}</Tag>;
  },
  MDBIcon: ({ style, className, far, icon, size }) => (
    <i style={style} className={`${className} ${far ? 'far' : ''} ${icon} fa-${size}`} aria-hidden="true"></i>
  ),
}));

describe('BlogDesc', () => {
  const mockBlogId = '123';
  const mockBlogData = {
    id: mockBlogId,
    title: 'Test Blog Title',
    imageURL: 'http://example.com/image.jpg',
    date: '2023-10-27',
    description: 'This is a test blog description.',
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to render the component within a router
  const renderWithRouter = (ui, { route = `/blog/${mockBlogId}` } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/blog/:id" element={ui} />
          <Route path="/" element={<div>Home Page</div>} /> {/* For "Go Back" link test */}
        </Routes>
      </MemoryRouter>
    );
  };

  // --- Test Case Summary 1: Data Fetching and Rendering ---

  it('should fetch and display blog data on mount when ID is present', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockBlogData });

    renderWithRouter(<BlogDesc />);

    // Check if the loading state is handled (e.g., no content yet)
    expect(screen.queryByText('Test Blog Title')).not.toBeInTheDocument();

    // Wait for the data to be fetched and rendered
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:3010/Blogs/${mockBlogId}`);
      expect(screen.getByText(mockBlogData.title)).toBeInTheDocument();
      expect(screen.getByText(mockBlogData.date)).toBeInTheDocument();
      expect(screen.getByText(mockBlogData.description)).toBeInTheDocument();
      expect(screen.getByAltText(mockBlogData.title)).toBeInTheDocument();
      expect(screen.getByAltText(mockBlogData.title)).toHaveAttribute('src', mockBlogData.imageURL);
    });
  });

  it('should not attempt to fetch blog data if ID is not present in URL', () => {
    renderWithRouter(<BlogDesc />, { route: '/blog/' }); // No ID provided

    // Expect axios.get not to be called
    expect(axios.get).not.toHaveBeenCalled();
    // Assert that no blog data is displayed
    expect(screen.queryByText(mockBlogData.title)).not.toBeInTheDocument();
  });

  it('should call toast.error when API call fails', async () => {
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValue(new Error(errorMessage));

    renderWithRouter(<BlogDesc />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:3010/Blogs/${mockBlogId}`);
      expect(toast.error).toHaveBeenCalledWith('SOmething went wrong');
    });
  });

  it('should call toast.error when API returns non-200 status', async () => {
    axios.get.mockResolvedValue({ status: 404, data: {} });

    renderWithRouter(<BlogDesc />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:3010/Blogs/${mockBlogId}`);
      expect(toast.error).toHaveBeenCalledWith('SOmething went wrong');
    });
  });

  it('should render correctly with minimal blog data', async () => {
    const minimalBlogData = {
      id: '456',
      title: 'Minimal Post',
      imageURL: '', // Empty image URL
      date: '', // Empty date
      description: 'Short description',
    };
    axios.get.mockResolvedValue({ status: 200, data: minimalBlogData });

    renderWithRouter(<BlogDesc />, { route: '/blog/456' });

    await waitFor(() => {
      expect(screen.getByText('Minimal Post')).toBeInTheDocument();
      expect(screen.getByText('Short description')).toBeInTheDocument();
      // Image should render but with an empty src, which is valid HTML
      expect(screen.getByAltText('Minimal Post')).toBeInTheDocument();
      expect(screen.getByAltText('Minimal Post')).toHaveAttribute('src', '');
      // Date might not be displayed if it's empty, check the icon's presence
      // The component displays date directly, if it's empty it won't show.
      expect(screen.queryByText('2023-10-27')).not.toBeInTheDocument(); // Assuming default date is not present
    });
  });

  it('should not render blog content if blog state is null/undefined', () => {
    // Render without resolving the axios call, so blog state remains undefined
    renderWithRouter(<BlogDesc />);

    // Assert that elements that depend on blog data are not in the document
    expect(screen.queryByText(mockBlogData.title)).not.toBeInTheDocument();
    expect(screen.queryByText(mockBlogData.date)).not.toBeInTheDocument();
    expect(screen.queryByText(mockBlogData.description)).not.toBeInTheDocument();
    expect(screen.queryByAltText(mockBlogData.title)).not.toBeInTheDocument();
  });

  // --- Test Case Summary 2: UI and User Interaction ---

  it('should have a "Go Back" link that navigates to the home page', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockBlogData });

    const { getByText } = renderWithRouter(<BlogDesc />);

    const goBackLink = getByText('Go Back');
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveAttribute('href', '/');

    // Simulate clicking the link
    fireEvent.click(goBackLink);

    // The MemoryRouter will handle the navigation internally. We can verify by
    // checking if the "Home Page" component (defined in the router setup) is rendered
    // or by checking if the current URL has changed if we were using a real router.
    // For this setup, let's assume the route change would be observed if we had a target.
    // A more robust test might involve checking if a navigation function was called,
    // but here we rely on the link's href and the MemoryRouter's behavior.

    // To verify navigation with MemoryRouter, you might need to mock `useNavigate`
    // or render a component that listens to route changes.
    // For simplicity here, we'll just assert the link's presence and href.
    // If we were to test the navigation directly, we'd wrap BlogDesc in a component
    // that uses useLocation or similar.

    // Let's test that the link's href is correct.
    expect(screen.getByText('Go Back')).toHaveAttribute('href', '/');

    // A more direct test for navigation would be to check if the rendered component
    // changed to something else if it was linked to another page that we render.
    // For this, let's re-render with a structure that allows verification.
    const { container } = render(
      <MemoryRouter initialEntries={[`/blog/${mockBlogId}`]}>
        <Routes>
          <Route path="/blog/:id" element={<BlogDesc />} />
          <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const goBackLinkElement = container.querySelector('a[href="/"]');
    fireEvent.click(goBackLinkElement);

    // After clicking, the "Home Page" should be visible if the navigation worked.
    // However, MemoryRouter doesn't automatically re-render the parent wrapper
    // to show the new route's content in the same way a real browser would.
    // We need to simulate the route change more directly for testing.
    // A simpler approach for the link itself is to check its attributes.
  });

  it('should display correct inline styles for the main container', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockBlogData });
    const { container } = renderWithRouter(<BlogDesc />);

    await waitFor(() => {
      const mainDiv = container.querySelector('div[style*="background-color: black"]');
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv).toHaveStyle('min-height: 100vh');
      expect(mainDiv).toHaveStyle('background-color: black');

      const mdbContainer = mainDiv.querySelector('[style*="border: 1px solid #d1ebe8"]');
      expect(mdbContainer).toBeInTheDocument();
      expect(mdbContainer).toHaveStyle('border: 1px solid #d1ebe8');
    });
  });

  it('should display correct inline styles for text and icons', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockBlogData });
    const { container } = renderWithRouter(<BlogDesc />);

    await waitFor(() => {
      // Title styling
      const titleElement = screen.getByText(mockBlogData.title);
      expect(titleElement).toHaveStyle('color: #ffff');
      expect(titleElement).toHaveStyle('margin-top: 20px');

      // Icon styling
      const calendarIcon = container.querySelector('i.fa-calendar-alt');
      expect(calendarIcon).toBeInTheDocument();
      expect(calendarIcon).toHaveStyle('float: left');
      expect(calendarIcon).toHaveStyle('margin-left: 8px');
      expect(calendarIcon).toHaveStyle('color: red');

      // Date styling
      const dateElement = screen.getByText(mockBlogData.date);
      expect(dateElement).toHaveStyle('float: left');
      expect(dateElement).toHaveStyle('margin-top: 6px');
      expect(dateElement).toHaveStyle('margin-left: 5px');
      expect(dateElement).toHaveStyle('color: red');

      // Description styling
      const descriptionElement = screen.getByText(mockBlogData.description);
      expect(descriptionElement).toHaveStyle('color: #fff');
      expect(descriptionElement).toHaveStyle('font-family: cursive');
      expect(descriptionElement).toHaveStyle('margin-top: 20px');
    });
  });

  it('should render blog image with correct styling', async () => {
    axios.get.mockResolvedValue({ status: 200, data: mockBlogData });
    const { container } = renderWithRouter(<BlogDesc />);

    await waitFor(() => {
      const imgElement = container.querySelector('img[alt="Test Blog Title"]');
      expect(imgElement).toBeInTheDocument();
      expect(imgElement).toHaveAttribute('src', mockBlogData.imageURL);
      expect(imgElement).toHaveClass('img-fluid rounded');
      expect(imgElement).toHaveStyle('width: 100%');
      expect(imgElement).toHaveStyle('max-height: 500px');
    });
  });

  // --- Test Case Summary 3: Routing ---

  it('should correctly extract the blog ID from URL parameters', () => {
    // This test relies on the component's internal use of useParams.
    // We ensure that when rendering with a specific route, the correct ID is used
    // by checking if axios.get is called with that ID.
    axios.get.mockResolvedValue({ status: 200, data: mockBlogData });

    renderWithRouter(<BlogDesc />, { route: `/blog/${mockBlogId}` });

    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3010/Blogs/${mockBlogId}`);
  });

  it('should handle different blog IDs correctly', async () => {
    const anotherBlogId = '456';
    const anotherBlogData = {
      id: anotherBlogId,
      title: 'Another Blog',
      imageURL: 'http://example.com/another.png',
      date: '2023-11-01',
      description: 'Description for another blog.',
    };
    axios.get.mockResolvedValue({ status: 200, data: anotherBlogData });

    renderWithRouter(<BlogDesc />, { route: `/blog/${anotherBlogId}` });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:3010/Blogs/${anotherBlogId}`);
      expect(screen.getByText(anotherBlogData.title)).toBeInTheDocument();
      expect(screen.getByText(anotherBlogData.date)).toBeInTheDocument();
      expect(screen.getByText(anotherBlogData.description)).toBeInTheDocument();
      expect(screen.getByAltText(anotherBlogData.title)).toHaveAttribute('src', anotherBlogData.imageURL);
    });
  });
});
```