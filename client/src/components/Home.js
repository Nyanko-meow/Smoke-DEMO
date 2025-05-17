import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Box,
    CardMedia,
    Paper,
    Divider,
    Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SpaIcon from '@mui/icons-material/Spa';

const HeroBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    padding: theme.spacing(8, 0),
    marginBottom: theme.spacing(6)
}));

const FeatureCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4]
    },
    border: 'none',
    boxShadow: 'none'
}));

const StatsCard = styled(Paper)(({ theme, bgcolor }) => ({
    padding: theme.spacing(3),
    textAlign: 'center',
    height: '100%',
    color: 'white',
    backgroundColor: bgcolor || theme.palette.primary.main,
    borderRadius: theme.spacing(2)
}));

const TestimonialCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[2]
}));

const DownloadSection = styled(Box)(({ theme }) => ({
    backgroundColor: '#6eedaf',
    borderRadius: theme.spacing(2),
    padding: theme.spacing(4),
    margin: theme.spacing(8, 0),
    color: theme.palette.getContrastText('#6eedaf')
}));

const Home = () => {
    // Mock data
    const features = [
        {
            icon: <AccessTimeIcon sx={{ fontSize: 80, color: 'primary.main' }} />,
            title: 'Keep track of your progress',
            description: 'With your dashboard, track your progress daily from the day you decide to quit smoking. Indicators such as money saved, cigarettes not smoked, life expectancy gained and many others will motivate you to continue your smoking cessation!'
        },
        {
            icon: <DirectionsRunIcon sx={{ fontSize: 80, color: 'primary.main' }} />,
            title: 'Get ready to stop smoking with our program',
            description: 'Our quit smoking application accompanies you in your journey, from the moment you think about quitting to the moment you are completely free of cigarettes.'
        },
        {
            icon: <PsychologyIcon sx={{ fontSize: 80, color: 'primary.main' }} />,
            title: 'A tool to deal with cravings',
            description: 'Our application offers you strategies to cope with your cravings. This feature will help you better understand your dependence and free yourself from it!'
        },
        {
            icon: <SpaIcon sx={{ fontSize: 80, color: 'primary.main' }} />,
            title: 'Breathe, you can do it!',
            description: 'With our breathing exercises, you learn to regain control of your emotions when you stop smoking.'
        }
    ];

    const stats = [
        { bgcolor: '#FFC107', title: '4.5 ★', subtitle: 'out of 5 stars for rating' },
        { bgcolor: '#9C27B0', title: '3.1 million', subtitle: 'users' },
        { bgcolor: '#FF5722', title: '$453 million', subtitle: 'saved in 2023' },
        { bgcolor: '#2196F3', title: '32,225', subtitle: 'years of life saved in 2023' }
    ];

    const testimonials = [
        {
            quote: "I like to see how my body just improves every day and when I reach some body goals I am happy and satisfied. This app helped me so much because it makes me see how far I've come.",
            name: 'Sarah K.',
            avatar: '/img/avatar1.jpg' // Placeholder, you'll need to add actual images later
        },
        {
            quote: "What I like most is that the app is motivating. I like the fact that we receive reports on our health. I can already see a huge difference in my energy levels.",
            name: 'Michael T.',
            avatar: '/img/avatar2.jpg'
        }
    ];

    return (
        <>
            {/* Hero Section */}
            <HeroBox>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                                Quit smoking easily now!
                            </Typography>
                            <Typography variant="h5" paragraph>
                                Join more than 3 million people who have already quit smoking with our platform!
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                component={RouterLink}
                                to="/register"
                                sx={{ mt: 2, textTransform: 'none', py: 1, px: 4 }}
                            >
                                Get Started
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                component="img"
                                src="https://placehold.co/600x400/6eedaf/white?text=App+Dashboard"
                                alt="App Dashboard"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 2,
                                    boxShadow: 3
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </HeroBox>

            {/* Video Section */}
            <Container maxWidth="lg" sx={{ my: 8, textAlign: 'center' }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                    Quitting smoking has never been easier!
                </Typography>
                <Box
                    component="video"
                    controls
                    poster="https://placehold.co/800x450/6eedaf/white?text=Video+Thumbnail"
                    sx={{
                        width: '100%',
                        maxWidth: 800,
                        borderRadius: 2,
                        mt: 4,
                        boxShadow: 1
                    }}
                >
                    <source src="#" type="video/mp4" />
                    Your browser does not support the video tag.
                </Box>
            </Container>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ my: 8 }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" textAlign="center">
                    Decades of research at your service
                </Typography>
                <Typography variant="h6" color="text.secondary" textAlign="center" paragraph>
                    Quit smoking with our mobile app and get all the help you need for every situation.
                </Typography>

                <Grid container spacing={4} sx={{ mt: 4 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <FeatureCard>
                                <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                    <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        component={RouterLink}
                        to="/features"
                        sx={{
                            textTransform: 'none',
                            '&:after': {
                                content: '"→"',
                                ml: 1
                            }
                        }}
                    >
                        Discover all
                    </Button>
                </Box>
            </Container>

            {/* Stats Section */}
            <Container maxWidth="lg" sx={{ my: 8 }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" textAlign="center">
                    Join millions that changed their lives with us
                </Typography>

                <Grid container spacing={3} sx={{ mt: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <StatsCard bgcolor={stat.bgcolor}>
                                <Typography variant="h3" component="p" fontWeight="bold">
                                    {stat.title}
                                </Typography>
                                <Typography variant="subtitle1">
                                    {stat.subtitle}
                                </Typography>
                            </StatsCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Testimonials Section */}
            <Container maxWidth="lg" sx={{ my: 8 }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" textAlign="center">
                    A quit smoking application designed for you and with you!
                </Typography>

                <Grid container spacing={4} sx={{ mt: 4 }}>
                    {testimonials.map((testimonial, index) => (
                        <Grid item xs={12} md={6} key={index}>
                            <TestimonialCard>
                                <Box sx={{ mb: 2, textAlign: 'center' }}>
                                    <FormatQuoteIcon color="primary" />
                                    <Typography variant="body1" paragraph>
                                        {testimonial.quote}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ mr: 2 }} alt={testimonial.name} src={testimonial.avatar} />
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {testimonial.name}
                                    </Typography>
                                </Box>
                            </TestimonialCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Blog Preview Section */}
            <Container maxWidth="lg" sx={{ my: 8 }}>
                <Typography variant="h4" component="h2" gutterBottom fontWeight="bold" textAlign="center">
                    All you need to know is here!
                </Typography>
                <Typography variant="h6" color="text.secondary" textAlign="center" paragraph>
                    Discover the latest articles from our blog, and find information to help you in your journey.
                </Typography>

                <Grid container spacing={4} sx={{ mt: 4 }}>
                    {[1, 2, 3].map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item}>
                            <Card sx={{ height: '100%' }}>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={`https://placehold.co/400x200/6eedaf/white?text=Blog+${item}`}
                                    alt={`Blog post ${item}`}
                                />
                                <CardContent>
                                    <Box sx={{ mb: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                bgcolor: 'primary.light',
                                                color: 'white',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1
                                            }}
                                        >
                                            Testimonials
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                        Stop smoking more easily — Personal stories
                                    </Typography>
                                    <Button
                                        component={RouterLink}
                                        to="/blog/1"
                                        sx={{
                                            textTransform: 'none',
                                            p: 0,
                                            '&:after': {
                                                content: '"→"',
                                                ml: 1
                                            }
                                        }}
                                    >
                                        Read more
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        variant="outlined"
                        component={RouterLink}
                        to="/blog"
                        sx={{ borderRadius: 8, textTransform: 'none', px: 4 }}
                    >
                        Read more articles
                    </Button>
                </Box>
            </Container>

            {/* Download Section */}
            <Container maxWidth="lg">
                <DownloadSection>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                                Your pocket partner to stop smoking!
                            </Typography>
                            <Typography variant="body1" paragraph>
                                With more than 3 million users and a rating of 4.5/5, our application is the tool you need to stop smoking!
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                component={RouterLink}
                                to="/register"
                                sx={{ mt: 2, borderRadius: 8, textTransform: 'none', px: 4 }}
                            >
                                Download
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                component="img"
                                src="https://placehold.co/600x400/white/6eedaf?text=App+Screenshots"
                                alt="App Screenshots"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: 2
                                }}
                            />
                        </Grid>
                    </Grid>
                </DownloadSection>
            </Container>
        </>
    );
};

export default Home; 