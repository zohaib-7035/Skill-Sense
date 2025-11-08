import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

interface Skill {
  id: string;
  skill_name: string;
  skill_type: string;
  confidence_score: number;
  evidence: string[];
  is_confirmed: boolean;
  cluster?: string;
  microstory?: string;
  state?: string;
}

interface SkillMapProps {
  skills: Skill[];
  onSkillClick: (skill: Skill) => void;
}

const CLUSTER_COLORS: Record<string, string> = {
  'Programming & Development': '#3b82f6',
  'Data & Analytics': '#8b5cf6',
  'Design & UX': '#ec4899',
  'Management & Leadership': '#f59e0b',
  'Communication & Collaboration': '#10b981',
  'Cloud & Infrastructure': '#06b6d4',
  'Security & Compliance': '#ef4444',
  'Marketing & Sales': '#f97316',
  'Product & Strategy': '#84cc16',
  'Other': '#6b7280',
};

function SkillNode({ 
  skill, 
  position, 
  onClick 
}: { 
  skill: Skill; 
  position: [number, number, number]; 
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const size = 0.5 + skill.confidence_score * 1.5;
  const color = CLUSTER_COLORS[skill.cluster || 'Other'] || '#6b7280';
  const isLocked = skill.state === 'locked';
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          opacity={isLocked ? 0.3 : 0.9}
          transparent
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.4}
        color={isLocked ? '#666666' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {skill.skill_name}
      </Text>
      {isLocked && (
        <Text
          position={[0, -size - 0.5, 0]}
          fontSize={0.3}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
        >
          🔒
        </Text>
      )}
    </group>
  );
}

export function SkillMap({ skills, onSkillClick }: SkillMapProps) {
  // Arrange skills in a circular/spiral pattern based on clusters
  const positions = useMemo(() => {
    const clusterGroups = skills.reduce((acc, skill) => {
      const cluster = skill.cluster || 'Other';
      if (!acc[cluster]) acc[cluster] = [];
      acc[cluster].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    const positions: [number, number, number][] = [];
    const clusters = Object.keys(clusterGroups);
    const angleStep = (Math.PI * 2) / clusters.length;

    clusters.forEach((cluster, clusterIdx) => {
      const clusterSkills = clusterGroups[cluster];
      const clusterAngle = angleStep * clusterIdx;
      const radius = 8;
      
      clusterSkills.forEach((skill, skillIdx) => {
        const skillAngle = clusterAngle + (skillIdx * 0.5);
        const skillRadius = radius + (skillIdx * 2);
        
        positions.push([
          Math.cos(skillAngle) * skillRadius,
          (skillIdx - clusterSkills.length / 2) * 2,
          Math.sin(skillAngle) * skillRadius,
        ]);
      });
    });

    return positions;
  }, [skills]);

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-background to-muted rounded-lg overflow-hidden border border-border">
      <Canvas camera={{ position: [0, 0, 25], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {skills.map((skill, idx) => (
          <SkillNode
            key={skill.id}
            skill={skill}
            position={positions[idx] || [0, 0, 0]}
            onClick={() => onSkillClick(skill)}
          />
        ))}
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
