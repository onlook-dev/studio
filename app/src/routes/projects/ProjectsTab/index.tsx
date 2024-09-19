import { CreateMethod } from '..';
import { ChooseMethod } from './Create/ChooseMethod';
import SelectProject from './Select';
import { Project } from '/common/models/project';

export function ProjectsTab({
    setCreateMethod,
}: {
    setCreateMethod: (method: CreateMethod | null) => void;
}) {
    const PROJECTS: Project[] = [
        // {
        //     id: '0',
        //     previewImg: 'https://picsum.photos/id/237/200/300',
        //     name: 'Airbnb.com',
        //     url: 'https://www.airbnb.com',
        //     createdAt: new Date().toISOString(),
        //     updatedAt: new Date().toISOString(),
        //     onlookEnabled: false,
        //     folderPath: '/path/to/folder',
        // },
        // {
        //     id: '1',
        //     previewImg: 'https://picsum.photos/id/238/300/200',
        //     name: 'Netflix Clone',
        //     url: 'https://www.netflix.com',
        //     createdAt: new Date().toISOString(),
        //     updatedAt: new Date().toISOString(),
        //     onlookEnabled: true,
        //     folderPath: '/path/to/folder',
        // },
        // {
        //     id: '2',
        //     previewImg: 'https://picsum.photos/id/239/500/500',
        //     name: 'Personal Portfolio',
        //     url: 'https://www.portfolio.com',
        //     createdAt: new Date().toISOString(),
        //     updatedAt: new Date().toISOString(),
        //     onlookEnabled: true,
        //     folderPath: '/path/to/folder',
        // },
    ];

    return (
        <>
            {PROJECTS.length === 0 && <ChooseMethod setCreateMethod={setCreateMethod} />}
            {PROJECTS.length > 0 && <SelectProject projects={PROJECTS} />}
        </>
    );
}
