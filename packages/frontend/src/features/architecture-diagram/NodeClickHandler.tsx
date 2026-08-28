import { useNavigate } from 'react-router-dom';
import type { Node } from '@xyflow/react';

export function useNodeClickHandler() {
  const navigate = useNavigate();

  const handleNodeClick = (node: Node) => {
    const data = node.data as any;
    const resourceId = data?.resourceId;
    const resourceType = data?.resourceType;

    if (!resourceId || !resourceType) return;

    const routeMap: Record<string, string> = {
      url: `/urls/${resourceId}`,
      application: `/applications/${resourceId}`,
      service: `/catalog/${resourceId}`,
      database: `/databases/${resourceId}`,
      server: `/servers/${resourceId}`,
    };

    const route = routeMap[resourceType];
    if (route) {
      navigate(route);
    }
  };

  return { handleNodeClick };
}
