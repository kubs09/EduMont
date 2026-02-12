import { useEffect, useState } from 'react';
import { Box, Button, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { texts } from '@frontend/texts';
import { useLanguage } from '@frontend/shared/contexts/LanguageContext';
import { ChildExcuseAction, Section } from '@frontend/shared/components';
import { formatDate } from '@frontend/shared/components/DatePicker/utils/utils';
import { ChildExcuse, getChildExcuses, getChildren } from '@frontend/services/api';
import { Child } from '@frontend/types/child';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@frontend/shared/route';

interface ChildrenSectionProps {
  onOpenChildren: () => void;
  subtleBg?: string;
}

const ChildrenSection = ({ onOpenChildren, subtleBg }: ChildrenSectionProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [excusesByChildId, setExcusesByChildId] = useState<Record<number, ChildExcuse[]>>({});

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await getChildren();
        const items = response || [];
        setChildren(items);

        const excusesEntries = await Promise.all(
          items.map(async (child) => {
            try {
              const excuses = await getChildExcuses(child.id);
              return [child.id, excuses] as const;
            } catch (error) {
              return [child.id, []] as const;
            }
          })
        );

        setExcusesByChildId(Object.fromEntries(excusesEntries));
      } catch (error) {
        setChildren([]);
      }
    };

    fetchChildren();
  }, []);

  const refreshExcusesForChild = async (childId: number) => {
    try {
      const excuses = await getChildExcuses(childId);
      setExcusesByChildId((prev) => ({
        ...prev,
        [childId]: excuses,
      }));
    } catch (error) {
      setExcusesByChildId((prev) => ({
        ...prev,
        [childId]: [],
      }));
    }
  };

  const getDisplayExcuse = (excuses: ChildExcuse[]) => {
    if (!excuses.length) return null;

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const parseDate = (value: string) => {
      const direct = new Date(value);
      if (!Number.isNaN(direct.getTime())) return direct;
      const withTime = new Date(`${value}T00:00:00`);
      return Number.isNaN(withTime.getTime()) ? null : withTime;
    };

    const parsed = excuses
      .map((excuse) => {
        const fromDate = parseDate(excuse.date_from);
        const toDate = parseDate(excuse.date_to);
        return {
          excuse,
          fromDate,
          toDate,
        };
      })
      .filter((item) => item.fromDate && item.toDate) as Array<{
      excuse: ChildExcuse;
      fromDate: Date;
      toDate: Date;
    }>;

    if (parsed.length === 0) return excuses[0];

    const active = parsed
      .filter((item) => todayDate >= item.fromDate && todayDate <= item.toDate)
      .sort((a, b) => a.toDate.getTime() - b.toDate.getTime());

    if (active.length > 0) return active[0].excuse;

    const upcoming = parsed
      .filter((item) => item.toDate >= todayDate)
      .sort((a, b) => a.fromDate.getTime() - b.fromDate.getTime());

    if (upcoming.length > 0) return upcoming[0].excuse;

    return parsed.sort((a, b) => b.toDate.getTime() - a.toDate.getTime())[0].excuse;
  };

  const formatExcuseDate = (value: string) => {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) {
      return formatDate(direct, language);
    }
    const fallback = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(fallback.getTime())) {
      return formatDate(fallback, language);
    }
    return value;
  };

  return (
    <Section title={texts.profile.children.titleParent[language]} cardProps={{ mb: 6 }}>
      <Stack spacing={4}>
        {children.length > 0 ? (
          <VStack align="start" spacing={2} w="full">
            {children.map((child) => (
              <Box bg={subtleBg} p={2} borderRadius="md" w="full" key={child.id}>
                {(() => {
                  const childExcuses = excusesByChildId[child.id] || [];
                  const activeExcuse = getDisplayExcuse(childExcuses);
                  return (
                    <HStack justify="space-between" w="full">
                      <HStack spacing={2}>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`${ROUTES.CHILDREN}/${child.id}`)}
                        >
                          {`${child.firstname} ${child.surname}`}
                        </Button>
                        {activeExcuse && (
                          <Text fontSize="sm" color="orange.500">
                            {texts.profile.children.excuse.status[language]} (
                            {formatExcuseDate(activeExcuse.date_from)}
                            {' - '}
                            {formatExcuseDate(activeExcuse.date_to)})
                          </Text>
                        )}
                      </HStack>
                      <ChildExcuseAction
                        childId={child.id}
                        childName={`${child.firstname} ${child.surname}`}
                        language={language}
                        excuse={activeExcuse}
                        onRefreshExcuses={refreshExcusesForChild}
                        size="sm"
                        variant="outline"
                      />
                    </HStack>
                  );
                })()}
              </Box>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500">{texts.profile.children.noChildren[language]}</Text>
        )}
        <HStack justify="flex-start">
          <Button variant="brand" onClick={onOpenChildren}>
            {texts.profile.children.viewDashboard[language]}
          </Button>
        </HStack>
      </Stack>
    </Section>
  );
};

export default ChildrenSection;
