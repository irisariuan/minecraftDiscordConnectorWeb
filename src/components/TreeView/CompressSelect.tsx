export enum CompressionMethod {
	Uncompressed = "uncompressed",
	Gzip = "gzip",
	Zlib = "zlib",
}

export default function CompressSelect({
	onCompress,
}: {
	onCompress: (compressionMethod: CompressionMethod) => void;
}) {
	return (
		<select
			onChange={(event) => {
				const currentVal = event.currentTarget.selectedOptions[0].value;
				if (
					!currentVal ||
					!Object.keys(CompressionMethod).includes(currentVal)
				)
					return;
				onCompress(currentVal as CompressionMethod);
			}}
			defaultValue="gzip"
			className="bg-neutral-700 text-white p-2 rounded-2xl"
		>
			<option value="uncompressed">Uncompressed</option>
			<option value="gzip">Gzip</option>
			<option value="zlib">Zlib</option>
		</select>
	);
}
