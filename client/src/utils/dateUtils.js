import { formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}; 