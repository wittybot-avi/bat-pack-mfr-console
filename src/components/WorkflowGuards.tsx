import React from 'react';
import { Button, Tooltip, Card, CardContent, Badge } from './ui/design-system';
import { GuardrailResult, NextStep } from '../services/workflowGuardrails';
import { ArrowRight, Lightbulb, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GatedActionProps {
  guard: GuardrailResult;
  onClick: () => void;
  label: string;
  icon?: any;
  variant?: any;
  className?: string;
  loading?: boolean;
}

export const GatedAction: React.FC<GatedActionProps> = ({ guard, onClick, label, icon: Icon, variant, className, loading }) => {
  const btn = (
    <Button 
      variant={variant} 
      className={className} 
      onClick={onClick} 
      disabled={!guard.allowed || loading}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {label}
      {!guard.allowed && <Lock className="ml-2 h-3 w-3 opacity-40" />}
    </Button>
  );

  if (!guard.allowed && guard.reason) {
    return (
      <Tooltip content={guard.reason}>
        <div className="w-full">{btn}</div>
      </Tooltip>
    );
  }

  return btn;
};

export const NextStepPrompt: React.FC<{ step: NextStep | null }> = ({ step }) => {
  const navigate = useNavigate();
  if (!step) return null;

  return (
    <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900 border-2 border-dashed shadow-none animate-in fade-in duration-500">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600">
          <Lightbulb size={20} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Next Recommended Action</h4>
            <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">{step.roleRequired}</Badge>
          </div>
          <p className="text-xs text-indigo-700/70 dark:text-indigo-400">{step.description}</p>
          <div className="pt-2">
            <Button 
              size="sm" 
              variant="link" 
              className="p-0 h-auto text-indigo-600 font-bold gap-1"
              onClick={() => step.path && navigate(step.path)}
            >
              {step.label} <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};