import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminService, type DashboardStats, type Conversion, type AdminError, type StatsByDate, type Profile } from '../../services/admin.service';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatCardComponent } from './components/StatCard';
import { FormatChart } from './components/FormatChart';
import { TimeChart } from './components/TimeChart';
import { ConversionsTable } from './components/ConversionsTable';
import { ErrorsTable } from './components/ErrorsTable';
import { PageTransition } from '../../components/common/PageTransition';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled(motion.header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  padding-bottom: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const HeaderTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Username = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ChartsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const TablesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileSection = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing['3xl']};
`;

const ProfileTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const ProfileCard = styled.div`
  background: ${({ theme }) => theme.colors.background.card};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const ProfileItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProfileLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const ProfileValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const AdminDashboard: React.FC = () => {
  const { username, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [errors, setErrors] = useState<AdminError[]>([]);
  const [statsByDate, setStatsByDate] = useState<StatsByDate | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (statsByDate === null) {
      loadStatsByDate(selectedDays);
    }
  }, [selectedDays]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardStats, conversionsData, errorsData, profileData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getRecentConversions(),
        adminService.getErrors(),
        adminService.getProfile(),
      ]);

      setStats(dashboardStats);
      setConversions(conversionsData.conversions);
      setErrors(errorsData.errors);
      setProfile(profileData);
      await loadStatsByDate(selectedDays);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatsByDate = async (days: number) => {
    try {
      const data = await adminService.getStatsByDate(days);
      setStatsByDate(data);
    } catch (error) {
      console.error('Failed to load stats by date:', error);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="lg" />
      </LoadingContainer>
    );
  }

  return (
    <PageTransition>
      <DashboardContainer>
        <Header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HeaderTitle>📊 Admin Dashboard</HeaderTitle>
          <HeaderActions>
            <Username>{username}</Username>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatCardComponent
            icon="📈"
            label="Total Conversions"
            value={stats?.total_conversions || 0}
            index={0}
          />
          <StatCardComponent
            icon="✅"
            label="Successful"
            value={stats?.successful_conversions || 0}
            index={1}
          />
          <StatCardComponent
            icon="📅"
            label="Today"
            value={stats?.conversions_today || 0}
            index={2}
          />
          <StatCardComponent
            icon="❌"
            label="Errors Today"
            value={stats?.errors_today || 0}
            index={3}
          />
          <StatCardComponent
            icon="🎯"
            label="Success Rate"
            value={`${stats?.success_rate || 0}%`}
            index={4}
          />
        </StatsGrid>

        <ChartsGrid
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {stats && <FormatChart formatData={stats.by_format} />}
          {statsByDate && (
            <TimeChart
              stats={statsByDate}
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
            />
          )}
        </ChartsGrid>

        <TablesGrid
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ConversionsTable conversions={conversions} />
          <ErrorsTable errors={errors} />
        </TablesGrid>

        {profile && (
          <ProfileSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ProfileTitle>Profile</ProfileTitle>
            <ProfileCard>
              <ProfileItem>
                <ProfileLabel>Username:</ProfileLabel>
                <ProfileValue>{profile.username || '-'}</ProfileValue>
              </ProfileItem>
              <ProfileItem>
                <ProfileLabel>Last Login:</ProfileLabel>
                <ProfileValue>
                  {profile.last_login
                    ? new Date(profile.last_login).toLocaleString()
                    : 'Never'}
                </ProfileValue>
              </ProfileItem>
            </ProfileCard>
          </ProfileSection>
        )}
      </DashboardContainer>
    </PageTransition>
  );
};

