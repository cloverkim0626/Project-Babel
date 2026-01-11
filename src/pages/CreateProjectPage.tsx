import { useNavigate } from 'react-router-dom';
import { ProjectWizard } from '../components/admin/cms/ProjectWizard';

export default function CreateProjectPage() {
    const navigate = useNavigate();

    return (
        <ProjectWizard
            onCancel={() => navigate('/admin')}
            onComplete={() => navigate('/admin')}
        />
    );
}
