import GainTrackForm from './GainTrackForm';

const GainTrackFormPage = ({ onSubmit, isLoading, error }) => (
  <GainTrackForm onSubmit={onSubmit} isLoading={isLoading} error={error} />
);

export default GainTrackFormPage;