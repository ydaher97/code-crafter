
"use client";
import type { FC } from 'react';
import * as Icons from 'lucide-react';

interface DynamicLucideIconProps extends Icons.LucideProps {
  name: string;
}

const DynamicLucideIcon: FC<DynamicLucideIconProps> = ({ name, ...props }) => {
  const IconComponent = (Icons as any)[name] as Icons.LucideIcon | undefined;

  if (!IconComponent) {
    console.warn(`Lucide icon "${name}" not found. Rendering default (AlertCircle).`);
    return <Icons.AlertCircle {...props} />; // Default icon
  }

  return <IconComponent {...props} />;
};

export default DynamicLucideIcon;
