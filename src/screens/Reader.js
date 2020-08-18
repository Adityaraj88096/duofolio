import React, { useState, useEffect } from 'react';
import StaticServer from 'react-native-static-server';
import { WebView } from 'react-native-webview';
import Epub from 'epubjs';
import { connect } from 'react-redux';
import * as actions from '../actions';
import showToast from '../components/Toast';
import Spinner from '../components/Spinner';

function Reader(props) {
	const [bookUrl, setBookUrl] = useState(null);
	const [serverInstance, setServerInstance] = useState(null);

	const { location, books, route } = props;

	let unsubscribe = props.navigation.addListener(
		'focus',
		() => {
			useEffect(() => {
				showToast('Parsing book');
				serverInstance && serverInstance.stop();
				let trail = route.params.url.split('/');
				let path = trail.splice(0, trail.length - 1).join('/');
				let server = new StaticServer(0, path, { localOnly: true, keepAlive: true });
				setServerInstance(server);
				server.start().then((url) => setBookUrl(`${url}/${trail[0]}`));
			});
			return unsubscribe;
		},
		[props.route.params.url]
	);

	const injectedJS = `window.FLOW = "paginated";
	window.BOOK_PATH = "${bookUrl}";
	window.LOCATION = ${location[books[route.params.index].key] || undefined};
`;

	function handleMetadata(e) {
		let parsedData = JSON.parse(e.nativeEvent.data);
		if (parsedData.cover) {
			parsedData.cover = bookUrl + parsedData.cover;
		}
		props.addMetadata(parsedData, route.params.index);
	}

	if (!bookUrl) {
		return <Spinner />;
	}

	return (
		<WebView
			source={{ uri: 'file:///android_asset/index.html' }}
			injectedJavaScriptBeforeContentLoaded={injectedJS}
			mixedContentMode="always"
			originWhitelist={['*']}
			allowFileAccess
			allowUniversalAccessFromFileURLs
			domStorageEnabled
			style={{ flex: 1 }}
			onMessage={handleMetadata}
		/>
	);
}

function mapStateToProps(state) {
	return {
		books: state.books,
		location: state.location
	};
}

export default connect(
	mapStateToProps,
	actions
)(Reader);
