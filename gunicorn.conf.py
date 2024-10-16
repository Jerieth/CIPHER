import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'eventlet'
bind = '0.0.0.0:5000'
