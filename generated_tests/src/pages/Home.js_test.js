```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Home from '../../src/pages/Home'; // Adjust the path as necessary
import Blog from '../../src/components/Blog'; // Adjust the path as necessary
import Pagination from '../../src/components/Pagination'; // Adjust the path as necessary

// Mock the axios instance
const mock = new MockAdapter(axios);

// Mock toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock window.confirm for delete operations
const confirmSpy = jest.spyOn(window, 'confirm');

// Mock child components to isolate Home component testing
jest.mock('../components/Blog', () => jest.fn(({ title, excerpt, description, handleDelete, id }) => (
  <div data-testid="mock-blog">
    <h3>{title}</h3>
    <p>{excerpt(description)}</p>
    <button onClick={() => handleDelete(id)}>Delete</button>
  </div>
)));

jest.mock('../components/Pagination', () => jest.fn(({ currentPage, loadBlogsData, pageLimit, data, totalBlog }) => (
  <div data-testid="mock-pagination">
    <button data-testid="prev-button" onClick={() => loadBlogsData(null, null, -1, null)}>Previous</button>
    <span data-testid="current-page">{currentPage}</span>
    <button data-testid="next-button" onClick={() => loadBlogsData(null, null, 1, null)}>Next</button>
    {totalBlog === 0 && <p>No more pages</p>}
  </div>
)));

describe('Home Component', () => {
  const API_BASE_URL = 'http://localhost:3010/Blogs';
  const PAGE_LIMIT = 5; // Match the value in the component

  // Reset mocks before each test
  beforeEach(() => {
    mock.reset();
    confirmSpy.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    Blog.mockClear(); // Clear mock instance calls
    Pagination.mockClear(); // Clear mock instance calls
  });

  // --- Data Fetching & Display Tests ---

  it('should fetch and display blogs on initial load', async () => {
    const mockBlogs = [
      { id: 1, title: 'Blog 1', description: 'Short description' },
      { id: 2, title: 'Blog 2', description: 'This is a longer description that will be truncated by the excerpt function to test its functionality and ensure it adds ellipsis.' },
    ];

    // Mock the API calls for fetching total blogs and current page data
    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs.slice(0, PAGE_LIMIT));

    render(<Home />);

    // Wait for the data to be fetched and rendered
    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(mockBlogs.length));

    // Verify that the Blog component is rendered with correct props
    expect(Blog).toHaveBeenCalledTimes(mockBlogs.length);

    // Verify that the correct data is passed to the Blog component
    expect(Blog).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      title: 'Blog 1',
      description: 'Short description',
    }), {});
    expect(Blog).toHaveBeenCalledWith(expect.objectContaining({
      id: 2,
      title: 'Blog 2',
      description: 'This is a longer description that will be truncated by the excerpt function to test its functionality and ensure it adds ellipsis.',
    }), {});

    // Verify that the excerpt function is called and handles long strings correctly
    const mockBlogProps = Blog.mock.calls.find(call => call[0].id === 2)[0];
    expect(mockBlogProps.excerpt(mockBlogProps.description)).toBe('This is a longer description that will be truncated by the excerpt function to test its functionality and ensure it adds ellipsis. ... ');
  });

  it('should display "Blog Not Found" when no blogs are available', async () => {
    // Mock API calls to return empty data
    mock.onGet(`${API_BASE_URL}`).reply(200, []);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, []);

    render(<Home />);

    // Check if the "Blog Not Found" message is displayed
    await waitFor(() => {
      expect(screen.getByText('Blog Not Found')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-blog')).not.toBeInTheDocument();
  });

  // --- Pagination Tests ---

  it('should navigate to the next page and update currentPage state', async () => {
    const mockBlogs = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `Blog ${i + 1}`, description: 'Short description' }));

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    // Initial load
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs.slice(0, PAGE_LIMIT));
    // Next page load
    mock.onGet(`${API_BASE_URL}?_start=${PAGE_LIMIT}&_end=${PAGE_LIMIT * 2}`).reply(200, mockBlogs.slice(PAGE_LIMIT, PAGE_LIMIT * 2));

    const { getByTestId } = render(<Home />);

    // Wait for initial blogs to load
    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(PAGE_LIMIT));
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');

    // Click the next page button
    const nextButton = getByTestId('next-button');
    fireEvent.click(nextButton);

    // Wait for the state update and potentially re-render of Blog component if data changes
    await waitFor(() => expect(screen.getByTestId('current-page')).toHaveTextContent('1'));
    // In this specific setup, loadBlogsData is called with increase=1 and operation=null
    // and currentPage state is updated to currentPage + increase.
    // So we expect currentPage to become 1.
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('should navigate to the previous page and update currentPage state', async () => {
    const mockBlogs = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `Blog ${i + 1}`, description: 'Short description' }));

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    // Initial load
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs.slice(0, PAGE_LIMIT));
    // Simulate navigating to next page first
    mock.onGet(`${API_BASE_URL}?_start=${PAGE_LIMIT}&_end=${PAGE_LIMIT * 2}`).reply(200, mockBlogs.slice(PAGE_LIMIT, PAGE_LIMIT * 2));
    // Previous page load
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs.slice(0, PAGE_LIMIT));

    const { getByTestId } = render(<Home />);

    // Wait for initial blogs to load
    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(PAGE_LIMIT));
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');

    // Navigate to next page
    const nextButton = getByTestId('next-button');
    fireEvent.click(nextButton);
    await waitFor(() => expect(screen.getByTestId('current-page')).toHaveTextContent('1'));

    // Click the previous page button
    const prevButton = getByTestId('prev-button');
    fireEvent.click(prevButton);

    // Wait for the state update and potentially re-render of Blog component if data changes
    await waitFor(() => expect(screen.getByTestId('current-page')).toHaveTextContent('0'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
  });

  it('should reset currentPage to 0 when deleting a blog', async () => {
    const mockBlogs = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, title: `Blog ${i + 1}`, description: 'Short description' }));

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    // Initial load
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs.slice(0, PAGE_LIMIT));
    // Simulate navigating to next page first to set currentPage to 1
    mock.onGet(`${API_BASE_URL}?_start=${PAGE_LIMIT}&_end=${PAGE_LIMIT * 2}`).reply(200, mockBlogs.slice(PAGE_LIMIT, PAGE_LIMIT * 2));
    // After delete, re-fetch from start with a limit of 6 and operation='delete'
    mock.onGet(`${API_BASE_URL}?_start=0&_end=6`).reply(200, mockBlogs.slice(0, 6));
    // Mock delete
    mock.onDelete(`${API_BASE_URL}/1`).reply(200, {});

    const { getByTestId, rerender } = render(<Home />);

    // Wait for initial blogs to load
    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(PAGE_LIMIT));
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');

    // Navigate to next page
    const nextButton = getByTestByTestId('next-button');
    fireEvent.click(nextButton);
    await waitFor(() => expect(screen.getByTestId('current-page')).toHaveTextContent('1'));

    // Ensure mock.history.get is cleared or check specific call for the next page
    const blogToDelete = screen.getAllByTestId('mock-blog')[0]; // This is mockBlogProps for id: 6
    const blogToDeleteId = mockBlogs.find(b => b.title === 'Blog 6').id; // Find the actual ID

    // Click delete on the first blog (which is Blog 6 if currentPage is 1 and limit is 5)
    fireEvent.click(blogToDelete.querySelector('button'));

    // Confirm the deletion
    confirmSpy.mockReturnValue(true);

    // Wait for deletion success message and re-fetch
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Blog Deleted Successfullly!!'));

    // Verify that currentPage state is reset to 0 after deletion
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
  });

  it('should handle fetching data when totalBlog is zero', async () => {
    // Mock API calls to return empty data for total blogs
    mock.onGet(`${API_BASE_URL}`).reply(200, []);
    // Initial load for current page
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, []);

    render(<Home />);

    // Check for "Blog Not Found" message
    await waitFor(() => {
      expect(screen.getByText('Blog Not Found')).toBeInTheDocument();
    });
    // Ensure no blogs are rendered
    expect(screen.queryByTestId('mock-blog')).not.toBeInTheDocument();
    // Ensure pagination component is rendered, and potentially indicates no more pages if that's how it's designed
    expect(screen.getByTestId('mock-pagination')).toBeInTheDocument();
  });

  it('should handle fetching data when totalBlog is less than pageLimit', async () => {
    const mockBlogs = [
      { id: 1, title: 'Blog 1', description: 'Short description' },
      { id: 2, title: 'Blog 2', description: 'Short description' },
    ];

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs);

    render(<Home />);

    // Wait for initial blogs to load
    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(mockBlogs.length));
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');

    // The Pagination component should ideally not show navigation controls if there's only one page or less.
    // We check that the pagination component is rendered, but we don't expect next/prev buttons to be active/visible.
    expect(screen.getByTestId('mock-pagination')).toBeInTheDocument();
    expect(screen.queryByTestId('next-button')).toBeInTheDocument(); // Assuming the mock pagination always renders buttons
  });


  // --- Deletion Tests ---

  it('should prompt for confirmation before deleting a blog', async () => {
    const mockBlogs = [{ id: 1, title: 'Blog 1', description: 'Short description' }];

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs);
    mock.onDelete(`${API_BASE_URL}/1`).reply(200, {}); // Mock delete call

    const { getByTestId } = render(<Home />);

    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(1));

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify that window.confirm was called
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure to delete this Blog?');
  });

  it('should successfully delete a blog and show success message', async () => {
    const mockBlogs = [{ id: 1, title: 'Blog 1', description: 'Short description' }];

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs);
    mock.onDelete(`${API_BASE_URL}/1`).reply(200, {}); // Mock successful delete

    // Mock the re-fetch after deletion to return no blogs
    mock.onGet(`${API_BASE_URL}?_start=0&_end=6`).reply(200, []);

    confirmSpy.mockReturnValue(true); // Simulate user confirming deletion

    render(<Home />);

    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(1));

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for confirmation and successful deletion
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Blog Deleted Successfullly!!');
    });

    // After deletion and re-fetch, the blog should be gone
    await waitFor(() => {
      expect(screen.queryByText('Blog 1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-blog')).not.toBeInTheDocument();
      expect(screen.getByText('Blog Not Found')).toBeInTheDocument();
    });
  });

  it('should show an error message if blog deletion fails', async () => {
    const mockBlogs = [{ id: 1, title: 'Blog 1', description: 'Short description' }];

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs);
    mock.onDelete(`${API_BASE_URL}/1`).reply(500, {}); // Mock failed delete

    confirmSpy.mockReturnValue(true); // Simulate user confirming deletion

    render(<Home />);

    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(1));

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for confirmation and error message
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Somerthing Went Wrong Boy');
    });

    // The blog should still be present as deletion failed
    expect(screen.getByText('Blog 1')).toBeInTheDocument();
  });

  it('should not delete the blog if the user cancels the confirmation', async () => {
    const mockBlogs = [{ id: 1, title: 'Blog 1', description: 'Short description' }];

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs);
    // Do not mock the delete API call here as it should not be made

    confirmSpy.mockReturnValue(false); // Simulate user canceling deletion

    render(<Home />);

    await waitFor(() => expect(screen.getAllByTestId('mock-blog')).toHaveLength(1));

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for confirmation
    await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith('Are you sure to delete this Blog?'));

    // Assert that toast.success or toast.error were not called
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();

    // The blog should still be present
    expect(screen.getByText('Blog 1')).toBeInTheDocument();
    // Verify that no delete API call was made
    expect(mock.history.delete).toHaveLength(0);
  });

  // --- Error Handling Tests ---

  it('should display an error toast when fetching total blogs fails', async () => {
    mock.onGet(`${API_BASE_URL}`).reply(500); // Simulate failure to fetch total blogs
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, []); // Mock current page fetch as well, though the error might occur first

    render(<Home />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Somerthing Went Wrong Boy');
    });
    expect(screen.queryByTestId('mock-blog')).not.toBeInTheDocument();
  });

  it('should display an error toast when fetching current page blogs fails', async () => {
    mock.onGet(`${API_BASE_URL}`).reply(200, []); // Simulate success for total blogs
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(500); // Simulate failure to fetch current page blogs

    render(<Home />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Somerthing Went Wrong Boy');
    });
    expect(screen.queryByTestId('mock-blog')).not.toBeInTheDocument();
    expect(screen.queryByText('Blog Not Found')).not.toBeInTheDocument(); // Error toast takes precedence
  });

  // --- Component Integration Tests ---

  it('should pass correct props to the Blog component', async () => {
    const mockBlogs = [{ id: 1, title: 'Test Blog', description: 'Test description' }];

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs);

    render(<Home />);

    await waitFor(() => expect(Blog).toHaveBeenCalled());

    expect(Blog).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        title: 'Test Blog',
        description: 'Test description',
        // The excerpt prop is a function. We can't assert its exact reference but can test its output.
      }),
      {} // props.context
    );
  });

  it('should pass correct props to the Pagination component', async () => {
    const mockBlogs = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `Blog ${i + 1}`, description: 'Short description' }));

    mock.onGet(`${API_BASE_URL}`).reply(200, mockBlogs);
    mock.onGet(`${API_BASE_URL}?_start=0&_end=${PAGE_LIMIT}`).reply(200, mockBlogs.slice(0, PAGE_LIMIT));

    render(<Home />);

    await waitFor(() => expect(Pagination).toHaveBeenCalled());

    expect(Pagination).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: 0,
        pageLimit: PAGE_LIMIT,
        totalBlog: mockBlogs.length,
        data: mockBlogs.slice(0, PAGE_LIMIT),
        // loadBlogsData is a function, cannot assert exact reference easily
      }),
      {} // props.context
    );
  });

  // --- Styling Tests (Basic checks) ---

  it('should have a black background for the main container', () => {
    render(<Home />);
    const container = screen.getByText('Home Page').closest('div');
    expect(container).toHaveStyle('background-color: black');
    expect(container).toHaveStyle('min-height: 100vh');
  });

  it('should render the main heading with correct classes', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /home page/i });
    expect(heading).toHaveClass('md-4');
    expect(heading).toHaveClass('mb-4');
    expect(heading).toHaveClass('w-100');
    expect(heading).toHaveClass('text-danger');
  });
});
```