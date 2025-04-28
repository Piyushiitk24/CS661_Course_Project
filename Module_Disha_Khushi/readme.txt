0. Requirements
python system-level installation

1. Navigate to Project Directory [It can be anywhere inside your system]
cd <path-to-project>;

2. Setup the Python Virtual Environment
	2.1 Create Virtual Environment
	python -m venv venv
	
	2.2 Activate Virtual Environment			
	[Windows] venv/Scripts/activate
	[MacOS/Linux] source venv/bin/activate

	2.3 Update pip
	python -m pip install --upgrade pip

	2.4 Install Dependencies
	pip install -r requirements.txt

3. Start Flask's Local Development Server [Port: 8080]
python app.py 

4. Integration
Add 'localhost:8080' as href to the link
Note : In app.py file, Change Port Number - 8080 if the port is already busy with some other service