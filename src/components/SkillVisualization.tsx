import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: 'explicit' | 'implicit';
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
}

interface SkillVisualizationProps {
  skills: Skill[];
}

const COLORS = {
  explicit: 'hsl(var(--primary))',
  implicit: 'hsl(var(--secondary))',
};

export function SkillVisualization({ skills }: SkillVisualizationProps) {
  const skillTypeData = [
    {
      name: 'Explicit',
      value: skills.filter(s => s.skill_type === 'explicit').length,
    },
    {
      name: 'Implicit',
      value: skills.filter(s => s.skill_type === 'implicit').length,
    },
  ];

  const topSkills = [...skills]
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 10)
    .map(skill => ({
      name: skill.skill_name.length > 15 
        ? skill.skill_name.substring(0, 15) + '...' 
        : skill.skill_name,
      confidence: skill.confidence_score * 100,
      type: skill.skill_type,
    }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top Skills by Confidence</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSkills}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="confidence" fill="hsl(var(--primary))" name="Confidence %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={skillTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {skillTypeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? COLORS.explicit : COLORS.implicit} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
