import { useState } from 'react';
import { Box, Paper, List, ListItemIcon, ListItemText, Divider, ListItemButton } from '@mui/material';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Імпортуємо розбиті компоненти
import CreateStoForm from './components/CreateStoForm';
import CreateAdminForm from './components/CreateAdminForm';
import StoList from './components/StoList';
import AdminList from './components/AdminList';
import VehicleList from './components/VehicleList';
import RequestList from './components/RequestList';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(0);

    const menuItems = [
        { text: 'Створити СТО', icon: <AddBusinessIcon />, component: <CreateStoForm /> },
        { text: 'Створити адміна СТО', icon: <PersonAddIcon />, component: <CreateAdminForm /> },
        { isDivider: true },
        { text: 'Список всіх СТО', icon: <StoreIcon />, component: <StoList /> },
        { text: 'Список адміністраторів', icon: <PeopleIcon />, component: <AdminList /> },
        { text: 'Список автомобілів', icon: <DirectionsCarIcon />, component: <VehicleList /> },
        { text: 'Список заявок', icon: <AssignmentIcon />, component: <RequestList /> },
    ];

    return (
        <Box sx={{ display: 'flex', gap: 3, mt: 2, height: '100%' }}>
            <Paper elevation={2} sx={{ width: 280, flexShrink: 0, height: 'fit-content' }}>
                <List component="nav">
                    {menuItems.map((item, index) => (
                        item.isDivider ? (
                            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
                        ) : (
                            <ListItemButton
                                key={item.text}
                                selected={activeTab === index}
                                onClick={() => setActiveTab(index)}
                            >
                                <ListItemIcon sx={{ color: activeTab === index ? 'primary.main' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        )
                    ))}
                </List>
            </Paper>

            <Box sx={{ flexGrow: 1 }}>
                {menuItems[activeTab]?.component}
            </Box>
        </Box>
    );
}