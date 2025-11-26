import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import LawyerReviewDialog from '../components/LawyerReviewDialog';
import { lawyerAPI } from '../services/api';

jest.mock('../services/api');

const mockLawyer = {
  id: '1',
  name: 'Dr. Max Mustermann',
  rating: 4.5,
  reviewCount: 42,
  reviews: [
    {
      rating: 5,
      comment: 'Sehr kompetent und freundlich!',
      author: 'Anna Schmidt',
      date: '2024-01-15',
    },
    {
      rating: 4,
      comment: 'Gute Beratung, hat mir sehr geholfen.',
      author: 'Peter Müller',
      date: '2024-01-10',
    },
  ],
};

describe('LawyerReviewDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <LawyerReviewDialog
          open={true}
          onClose={jest.fn()}
          lawyer={mockLawyer}
          {...props}
        />
      </I18nextProvider>
    );
  };

  it('should render review dialog with lawyer name and rating', () => {
    renderComponent();
    expect(screen.getByText(/Dr. Max Mustermann/i)).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should display existing reviews', () => {
    renderComponent();
    expect(screen.getByText(/Sehr kompetent und freundlich!/i)).toBeInTheDocument();
    expect(screen.getByText(/Anna Schmidt/i)).toBeInTheDocument();
    expect(screen.getByText(/Gute Beratung, hat mir sehr geholfen./i)).toBeInTheDocument();
    expect(screen.getByText(/Peter Müller/i)).toBeInTheDocument();
  });

  it('should show review form when clicking write review button', async () => {
    renderComponent();
    
    const writeReviewButton = screen.getByRole('button', { name: /Bewertung schreiben/i });
    fireEvent.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/Ihre Bewertung/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ihr Kommentar/i)).toBeInTheDocument();
    });
  });

  it('should not submit review without rating', async () => {
    renderComponent();
    
    const writeReviewButton = screen.getByRole('button', { name: /Bewertung schreiben/i });
    fireEvent.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Ihr Kommentar/i)).toBeInTheDocument();
    });

    const commentField = screen.getByLabelText(/Ihr Kommentar/i);
    fireEvent.change(commentField, { target: { value: 'Great lawyer!' } });

    const submitButton = screen.getByRole('button', { name: /Absenden/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Bitte geben Sie eine Bewertung ab/i)).toBeInTheDocument();
    });
  });

  it('should not submit review without comment', async () => {
    renderComponent();
    
    const writeReviewButton = screen.getByRole('button', { name: /Bewertung schreiben/i });
    fireEvent.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/Ihre Bewertung/i)).toBeInTheDocument();
    });

    // Set rating
    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]); // 5 stars

    const submitButton = screen.getByRole('button', { name: /Absenden/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Bitte geben Sie einen Kommentar ein/i)).toBeInTheDocument();
    });
  });

  it('should successfully submit review', async () => {
    (lawyerAPI.submitReview as jest.Mock).mockResolvedValue({
      success: true,
      data: { reviewId: '123' },
    });

    const onReviewSubmitted = jest.fn();
    renderComponent({ onReviewSubmitted });
    
    const writeReviewButton = screen.getByRole('button', { name: /Bewertung schreiben/i });
    fireEvent.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/Ihre Bewertung/i)).toBeInTheDocument();
    });

    // Set rating
    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]); // 5 stars

    // Set comment
    const commentField = screen.getByLabelText(/Ihr Kommentar/i);
    fireEvent.change(commentField, { target: { value: 'Excellent service!' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Absenden/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(lawyerAPI.submitReview).toHaveBeenCalledWith('1', {
        rating: 5,
        comment: 'Excellent service!',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Bewertung erfolgreich eingereicht/i)).toBeInTheDocument();
      expect(onReviewSubmitted).toHaveBeenCalled();
    });
  });

  it('should handle review submission error', async () => {
    (lawyerAPI.submitReview as jest.Mock).mockRejectedValue(
      new Error('Submission failed')
    );

    renderComponent();
    
    const writeReviewButton = screen.getByRole('button', { name: /Bewertung schreiben/i });
    fireEvent.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/Ihre Bewertung/i)).toBeInTheDocument();
    });

    // Set rating and comment
    const ratingStars = screen.getAllByRole('radio');
    fireEvent.click(ratingStars[4]);
    
    const commentField = screen.getByLabelText(/Ihr Kommentar/i);
    fireEvent.change(commentField, { target: { value: 'Test comment' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Absenden/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Einreichen der Bewertung/i)).toBeInTheDocument();
    });
  });

  it('should cancel review form', async () => {
    renderComponent();
    
    const writeReviewButton = screen.getByRole('button', { name: /Bewertung schreiben/i });
    fireEvent.click(writeReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/Ihre Bewertung/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Ihre Bewertung/i)).not.toBeInTheDocument();
    });
  });

  it('should show message when no reviews exist', () => {
    const lawyerWithoutReviews = {
      ...mockLawyer,
      reviews: [],
    };

    render(
      <I18nextProvider i18n={i18n}>
        <LawyerReviewDialog
          open={true}
          onClose={jest.fn()}
          lawyer={lawyerWithoutReviews}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(/Noch keine Bewertungen/i)).toBeInTheDocument();
  });
});
