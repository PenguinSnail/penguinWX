import React, { useState, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AuthContext from '../../contexts/AuthContext';

import { Card, CardHeader, CardContent } from '@material-ui/core';
import { Button } from '@material-ui/core';

import Notification from '../../components/Notification';

const useStyles = makeStyles(theme => ({
	card: {
		margin: '15px',
		width: '100%',
		maxWidth: '350px',
	},
	spacer: { flexGrow: 1 },
	button: {
		width: '100%',
		marginBottom: 15,
	},
}));

function Passes() {
	const classes = useStyles();
	const { auth } = useContext(AuthContext);

	const [notificationState, setNotificationState] = useState({ open: false, message: '', variant: 'info' });
	const closeNotification = () => {
		setNotificationState({ ...notificationState, open: false });
	};

	return (
		<Card className={classes.card}>
			<CardHeader title="Pass Actions" />
			<CardContent>
				<Button
					className={classes.button}
					variant="contained"
					color="primary"
					onClick={() => {
						fetch('/api/passes/action', {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json', 'auth-jwt': auth.token },
							body: JSON.stringify({ action: 'schedule_new' }),
						}).then(res => {
							if (res.status > 199 && res.status < 300) {
								setNotificationState({
									open: true,
									message: 'Queued scheduling new passes',
									variant: 'info',
								});
							} else {
								setNotificationState({
									open: true,
									message: 'Failed to schedule new passes',
									variant: 'error',
								});
							}
						});
					}}
				>
					Schedule New Passes
				</Button>
				<Button
					className={classes.button}
					variant="contained"
					color="secondary"
					onClick={() => {
						fetch('/api/passes/action', {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json', 'auth-jwt': auth.token },
							body: JSON.stringify({ action: 'delete_scheduled' }),
						}).then(res => {
							if (res.status > 199 && res.status < 300) {
								setNotificationState({
									open: true,
									message: 'Deleted all scheduled passes',
									variant: 'success',
								});
							} else {
								setNotificationState({
									open: true,
									message: 'Failed to delete scheduled passes',
									variant: 'error',
								});
							}
						});
					}}
				>
					Clear Scheduled Passes
				</Button>
			</CardContent>
			<Notification
				open={notificationState.open}
				variant={notificationState.variant}
				message={notificationState.message}
				onClose={closeNotification}
			/>
		</Card>
	);
}

export default Passes;
